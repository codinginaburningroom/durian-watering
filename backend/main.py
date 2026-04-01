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
    payload = record.model_dump(exclude_none=True)
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

@app.get("/api/reports/daily")
def report_daily():
    data = supabase.table('watering_records').select('*').execute()
    grouped = defaultdict(lambda: {"total_liters": 0.0, "total_duration": 0, "count": 0})
    
    for r in data.data:
        dt = datetime.fromisoformat(r['timestamp'].replace('Z', '+00:00'))
        day_str = dt.strftime('%Y-%m-%d')
        grouped[day_str]["total_liters"] += r.get("liter_amount") or 0
        grouped[day_str]["total_duration"] += r.get("duration_minutes") or 0
        grouped[day_str]["count"] += 1
        
    results = [{"date": k, **v} for k, v in sorted(grouped.items())]
    # Return last 30 days of activity
    return results[-30:]

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

@app.get("/api/reports/custom")
def report_custom(start_at: str, end_at: str):
    data = supabase.table('watering_records').select('*').gte('timestamp', start_at).lte('timestamp', end_at).execute()
    total_liters = sum(r.get("liter_amount") or 0 for r in data.data)
    total_duration = sum(r.get("duration_minutes") or 0 for r in data.data)
    count = len(data.data)
    return {"total_liters": total_liters, "total_duration": total_duration, "count": count}

# ====== User Auth & Admin ======
@app.post("/api/auth/register")
def register(user: schemas.UserCreate):
    existing = supabase.table('app_users').select('id').eq('username', user.username).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    data = supabase.table('app_users').insert(user.model_dump()).execute()
    if not data.data:
        raise HTTPException(status_code=400, detail="Failed to register")
    return {"message": "Register success"}

@app.post("/api/auth/login")
def login(user: schemas.UserLogin):
    data = supabase.table('app_users').select('*').eq('username', user.username).eq('password', user.password).execute()
    if not data.data:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    u = data.data[0]
    return {"id": u["id"], "username": u["username"], "role": u["role"]}

@app.get("/api/users", response_model=List[schemas.User])
def get_users():
    data = supabase.table('app_users').select('*').order('created_at', desc=True).execute()
    return data.data

@app.post("/api/users")
def create_admin_user(user: schemas.UserCreate):
    existing = supabase.table('app_users').select('id').eq('username', user.username).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Username already exists")
        
    data = supabase.table('app_users').insert(user.model_dump()).execute()
    if not data.data:
        raise HTTPException(status_code=400, detail="Failed to create user")
    return data.data[0]

@app.put("/api/users/{user_id}")
def update_user(user_id: int, user_update: schemas.UserUpdate):
    payload = user_update.model_dump(exclude_unset=True)
    if not payload:
        return {"ok": True}
        
    if 'username' in payload:
        existing = supabase.table('app_users').select('id').eq('username', payload['username']).neq('id', user_id).execute()
        if existing.data:
            raise HTTPException(status_code=400, detail="Username already exists")
            
    data = supabase.table('app_users').update(payload).eq('id', user_id).execute()
    if not data.data:
        raise HTTPException(status_code=404, detail="User not found")
    return data.data[0]

@app.delete("/api/users/{user_id}")
def delete_user(user_id: int):
    supabase.table('app_users').delete().eq('id', user_id).execute()
    return {"ok": True}

@app.get("/api/reports/users")
def report_user_growth():
    data = supabase.table('app_users').select('created_at').execute()
    grouped = defaultdict(int)
    for u in data.data:
        dt = datetime.fromisoformat(u['created_at'].replace('Z', '+00:00'))
        month_str = f"{dt.year}-{dt.month:02d}"
        grouped[month_str] += 1
        
    results = []
    total = 0
    for k, v in sorted(grouped.items()):
        total += v
        results.append({"month": k, "new_users": v, "total_users": total})
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
