from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.services.doctor_service import DoctorService
from app.services.auth_service import get_current_user
from app.models.core import User
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/api/doctors", tags=["Doctor Management"])

class DoctorCreateRequest(BaseModel):
    name: str
    email: str
    password: Optional[str] = "password123"
    specialty: str
    specializations: Optional[List[str]] = None
    hospital_id: Optional[str] = None
    experience_years: int = 0
    rating: float = 5.0
    consultation_duration_minutes: int = 30
    is_emergency_available: bool = False
    working_days: Optional[List[int]] = [0, 1, 2, 3, 4]
    start_time: str = "09:00"
    end_time: str = "17:00"

class DoctorUpdateRequest(BaseModel):
    name: Optional[str] = None
    specialty: Optional[str] = None
    specializations: Optional[List[str]] = None
    hospital_id: Optional[str] = None
    experience_years: Optional[int] = None
    rating: Optional[float] = None
    consultation_duration_minutes: Optional[int] = None
    is_active: Optional[bool] = None
    is_emergency_available: Optional[bool] = None

@router.get("/")
def list_doctors(
    specialty: Optional[str] = Query(None),
    hospital_id: Optional[str] = Query(None),
    active_only: bool = Query(True),
    db: Session = Depends(get_db)
):
    doctors = DoctorService.get_all_doctors(db, specialty=specialty, hospital_id=hospital_id, active_only=active_only)
    return {"success": True, "data": doctors, "count": len(doctors)}

@router.get("/{doctor_id}")
def get_doctor(doctor_id: str, db: Session = Depends(get_db)):
    doctor = DoctorService.get_doctor_by_id(db, doctor_id)
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return {"success": True, "data": doctor}

@router.post("/")
def create_doctor(
    req: DoctorCreateRequest,
    db: Session = Depends(get_db)
):
    try:
        doctor = DoctorService.create_doctor(db, req.dict())
        return {"success": True, "data": doctor, "message": "Doctor created successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{doctor_id}")
def update_doctor(
    doctor_id: str,
    req: DoctorUpdateRequest,
    db: Session = Depends(get_db)
):
    doctor = DoctorService.update_doctor(db, doctor_id, req.dict(exclude_unset=True))
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return {"success": True, "data": doctor, "message": "Doctor updated successfully"}

@router.delete("/{doctor_id}")
def deactivate_doctor(
    doctor_id: str,
    db: Session = Depends(get_db)
):
    success = DoctorService.deactivate_doctor(db, doctor_id)
    if not success:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return {"success": True, "message": "Doctor deactivated successfully"}
