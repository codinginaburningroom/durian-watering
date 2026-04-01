from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ZoneBase(BaseModel):
    name: str
    description: Optional[str] = None
    tree_count: Optional[int] = 0

class ZoneCreate(ZoneBase):
    pass

class Zone(ZoneBase):
    id: int

    class Config:
        from_attributes = True

class WateringRecordBase(BaseModel):
    timestamp: datetime
    duration_minutes: int
    liter_amount: float
    zone: str
    zone_id: Optional[int] = None
    notes: Optional[str] = None

class WateringRecordCreate(WateringRecordBase):
    pass

class WateringRecordUpdate(BaseModel):
    timestamp: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    liter_amount: Optional[float] = None
    zone: Optional[str] = None
    zone_id: Optional[int] = None
    notes: Optional[str] = None

class WateringRecord(WateringRecordBase):
    id: int

    class Config:
        from_attributes = True
