from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from datetime import datetime
from collections import defaultdict
import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

import schemas
from database import supabase

app = FastAPI(title="Durian Orchard Watering API (Supabase)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Zones
@app.post("/api/zones/", response_model=schemas.Zone)
def create_zone(zone: schemas.ZoneCreate):
    data = supabase.table('zones').insert(zone.model_dump()).execute()
    if not data.data:
        raise HTTPException(status_code=400, detail="Failed to create zone")
    return data.data[0]

@app.get("/api/zones/", response_model=List[schemas.Zone])
def read_zones():
    data = supabase.table('zones').select('*').execute()
    return data.data

# Watering Records
@app.post("/api/watering/", response_model=schemas.WateringRecord)
def create_record(record: schemas.WateringRecordCreate):
    payload = record.model_dump()
    # Ensure timestamp is string for ISO format
    if isinstance(payload.get('timestamp'), datetime):
        payload['timestamp'] = payload['timestamp'].isoformat()
        
    data = supabase.table('watering_records').insert(payload).execute()
    if not data.data:
        raise HTTPException(status_code=400, detail="Failed to create record")
    return data.data[0]

@app.get("/api/watering/", response_model=List[schemas.WateringRecord])
def read_records():
    data = supabase.table('watering_records').select('*').order('timestamp', desc=True).execute()
    return data.data

@app.put("/api/watering/{record_id}", response_model=schemas.WateringRecord)
def update_record(record_id: int, record_update: schemas.WateringRecordUpdate):
    payload = record_update.model_dump(exclude_unset=True)
    if 'timestamp' in payload and isinstance(payload['timestamp'], datetime):
        payload['timestamp'] = payload['timestamp'].isoformat()
        
    data = supabase.table('watering_records').update(payload).eq('id', record_id).execute()
    if not data.data:
        raise HTTPException(status_code=404, detail="Record not found")
    return data.data[0]

@app.delete("/api/watering/{record_id}")
def delete_record(record_id: int):
    supabase.table('watering_records').delete().eq('id', record_id).execute()
    return {"ok": True}

# Reports (Grouped in Python since Supabase REST doesn't support GROUP BY natively)
@app.get("/api/reports/weekly")
def report_weekly():
    data = supabase.table('watering_records').select('*').execute()
    grouped = defaultdict(lambda: {"total_liters": 0.0, "total_duration": 0, "count": 0})
    
    for r in data.data:
        dt = datetime.fromisoformat(r['timestamp'].replace('Z', '+00:00'))
        week_str = f"{dt.year}-{dt.isocalendar()[1]:02d}"
        grouped[week_str]["total_liters"] += r.get("liter_amount") or 0
        grouped[week_str]["total_duration"] += r.get("duration_minutes") or 0
        grouped[week_str]["count"] += 1
        
    results = [{"week": k, **v} for k, v in sorted(grouped.items())]
    return results

@app.get("/api/reports/monthly")
def report_monthly():
    data = supabase.table('watering_records').select('*').execute()
    grouped = defaultdict(lambda: {"total_liters": 0.0, "total_duration": 0, "count": 0})
    
    for r in data.data:
        dt = datetime.fromisoformat(r['timestamp'].replace('Z', '+00:00'))
        month_str = f"{dt.year}-{dt.month:02d}"
        grouped[month_str]["total_liters"] += r.get("liter_amount") or 0
        grouped[month_str]["total_duration"] += r.get("duration_minutes") or 0
        grouped[month_str]["count"] += 1
        
    results = [{"month": k, **v} for k, v in sorted(grouped.items())]
    return results

@app.get("/api/reports/yearly")
def report_yearly():
    data = supabase.table('watering_records').select('*').execute()
    grouped = defaultdict(lambda: {"total_liters": 0.0, "total_duration": 0, "count": 0})
    
    for r in data.data:
        dt = datetime.fromisoformat(r['timestamp'].replace('Z', '+00:00'))
        year_str = f"{dt.year}"
        grouped[year_str]["total_liters"] += r.get("liter_amount") or 0
        grouped[year_str]["total_duration"] += r.get("duration_minutes") or 0
        grouped[year_str]["count"] += 1
        
    results = [{"year": k, **v} for k, v in sorted(grouped.items())]
    return results

# Mount static files (React build)
static_dir = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.exists(static_dir):
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")

@app.exception_handler(404)
async def catch_all(request, exc):
    index_path = os.path.join(static_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"detail": "Not Found"}
