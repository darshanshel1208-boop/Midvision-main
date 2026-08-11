from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
import datetime

from app.database.database import get_db
from app.models.core import Doctor, User, Patient
from app.models.presence import DoctorPresence, PresenceSensorLog, DoctorWaitlist
from app.services.presence_service import PresenceService
from app.services.ai_slot_allocator import AISlotAllocator

router = APIRouter(prefix="/presence", tags=["Presence & Slot Allocation"])

# Request Pydantic Schemas
class RFIDEventPayload(BaseModel):
    rfid_tag_id: str
    room_number: str = "OPD Cabin 101"
    action: str = "ENTER" # ENTER, EXIT, SWIPE_IN
    reader_id: str = "RFID-READER-MAIN"

class FaceDetectionPayload(BaseModel):
    face_id: str
    confidence_score: float = 0.95
    room_number: str = "OPD Cabin 101"
    camera_id: str = "CAM-DOOR-01"

class MobileProximityPayload(BaseModel):
    mobile_device_id: str
    distance_meters: float = 1.2
    beacon_id: str = "BLE-BEACON-01"

class StatusOverridePayload(BaseModel):
    doctor_id: str
    status: str # ABSENT, PRESENT, IN_CONSULTATION, ON_BREAK
    room_number: Optional[str] = "OPD Cabin 101"

class WaitlistRequestPayload(BaseModel):
    patient_id: str
    doctor_id: Optional[str] = None
    specialty_required: str = "General Physician"
    urgency_level: str = "NORMAL" # EMERGENCY, URGENT, NORMAL, FOLLOW_UP
    symptoms: Optional[str] = "General checkup request"
    report_id: Optional[str] = None

class AllocateSlotsPayload(BaseModel):
    doctor_id: str


@router.post("/rfid")
def rfid_sensor_event(payload: RFIDEventPayload, db: Session = Depends(get_db)):
    result = PresenceService.process_rfid_event(
        db, 
        rfid_tag_id=payload.rfid_tag_id, 
        room_number=payload.room_number, 
        action=payload.action,
        reader_id=payload.reader_id
    )
    return result

@router.post("/face-detection")
def face_detection_event(payload: FaceDetectionPayload, db: Session = Depends(get_db)):
    result = PresenceService.process_face_detection_event(
        db,
        face_id=payload.face_id,
        confidence_score=payload.confidence_score,
        room_number=payload.room_number,
        camera_id=payload.camera_id
    )
    return result

@router.post("/mobile-proximity")
def mobile_proximity_event(payload: MobileProximityPayload, db: Session = Depends(get_db)):
    result = PresenceService.process_mobile_proximity_event(
        db,
        mobile_device_id=payload.mobile_device_id,
        distance_meters=payload.distance_meters,
        beacon_id=payload.beacon_id
    )
    return result

@router.post("/override")
def manual_status_override(payload: StatusOverridePayload, db: Session = Depends(get_db)):
    result = PresenceService.manual_override_status(
        db,
        doctor_id=payload.doctor_id,
        status=payload.status,
        room_number=payload.room_number
    )
    return result

@router.get("/doctors")
def get_all_doctor_presences(db: Session = Depends(get_db)):
    doctors = db.query(Doctor).all()
    results = []
    for doc in doctors:
        presence = PresenceService.get_or_create_presence(db, doc.id)
        user = db.query(User).filter(User.id == doc.user_id).first()
        results.append({
            "doctor_id": doc.id,
            "doctor_name": user.full_name if user else "Doctor",
            "specialty": doc.specialty,
            "status": presence.status,
            "room_number": presence.room_number,
            "zone_name": presence.zone_name,
            "rfid_tag_id": presence.rfid_tag_id,
            "face_id": presence.face_id,
            "mobile_device_id": presence.mobile_device_id,
            "last_detection_method": presence.last_detection_method,
            "confidence": presence.presence_confidence,
            "distance_meters": presence.distance_meters,
            "last_seen_at": presence.last_seen_at.strftime("%Y-%m-%d %H:%M:%S") if presence.last_seen_at else None
        })
    return {"doctors": results}

@router.get("/logs")
def get_presence_sensor_logs(limit: int = 30, db: Session = Depends(get_db)):
    logs = db.query(PresenceSensorLog).order_by(PresenceSensorLog.timestamp.desc()).limit(limit).all()
    res = []
    for log in logs:
        doc = db.query(Doctor).filter(Doctor.id == log.doctor_id).first()
        user = db.query(User).filter(User.id == doc.user_id).first() if doc else None
        res.append({
            "id": log.id,
            "doctor_name": user.full_name if user else "Doctor",
            "sensor_type": log.sensor_type,
            "device_id": log.device_id,
            "event_action": log.event_action,
            "confidence_score": log.confidence_score,
            "detected_room": log.detected_room,
            "timestamp": log.timestamp.strftime("%Y-%m-%d %H:%M:%S")
        })
    return {"logs": res}

@router.post("/waitlist")
def add_patient_to_waitlist(payload: WaitlistRequestPayload, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == payload.patient_id).first()
    if not patient:
        # Fallback create mock patient if ID not found for seamless testing
        user = db.query(User).first()
        if not user:
            raise HTTPException(status_code=404, detail="No users found in database")
        patient = db.query(Patient).filter(Patient.user_id == user.id).first()

    waitlist_item = DoctorWaitlist(
        patient_id=patient.id,
        doctor_id=payload.doctor_id,
        specialty_required=payload.specialty_required,
        urgency_level=payload.urgency_level.upper(),
        symptoms=payload.symptoms,
        report_id=payload.report_id,
        status="WAITLISTED",
        priority_score=1.0,
        requested_at=datetime.datetime.utcnow()
    )
    # Calculate score
    score = AISlotAllocator.calculate_patient_priority_score(waitlist_item)
    waitlist_item.priority_score = score

    db.add(waitlist_item)
    db.commit()
    db.refresh(waitlist_item)

    # Check if doctor is present and auto-allocate immediately if present
    allocation_msg = None
    if payload.doctor_id:
        allocation_result = AISlotAllocator.auto_allocate_waitlist(db, payload.doctor_id)
        if allocation_result.get("allocated"):
            allocation_msg = "Doctor is present! Slot auto-allocated immediately."

    return {
        "success": True,
        "waitlist_id": waitlist_item.id,
        "patient_id": waitlist_item.patient_id,
        "urgency_level": waitlist_item.urgency_level,
        "ai_priority_score": score,
        "status": waitlist_item.status,
        "message": allocation_msg or "Patient added to AI Waitlist. Will auto-allocate upon doctor presence."
    }

@router.get("/waitlist")
def get_waitlist_queue(db: Session = Depends(get_db)):
    items = db.query(DoctorWaitlist).order_by(DoctorWaitlist.priority_score.desc()).all()
    res = []
    for item in items:
        patient = db.query(Patient).filter(Patient.id == item.patient_id).first()
        user = db.query(User).filter(User.id == patient.user_id).first() if patient else None
        doc = db.query(Doctor).filter(Doctor.id == item.doctor_id).first() if item.doctor_id else None
        doc_user = db.query(User).filter(User.id == doc.user_id).first() if doc else None

        res.append({
            "id": item.id,
            "patient_name": user.full_name if user else "Patient",
            "doctor_name": doc_user.full_name if doc_user else "Any Available",
            "specialty_required": item.specialty_required,
            "urgency_level": item.urgency_level,
            "symptoms": item.symptoms,
            "status": item.status,
            "priority_score": item.priority_score,
            "requested_at": item.requested_at.strftime("%Y-%m-%d %H:%M:%S")
        })
    return {"waitlist": res}

@router.post("/allocate")
def trigger_ai_allocation(payload: AllocateSlotsPayload, db: Session = Depends(get_db)):
    result = AISlotAllocator.auto_allocate_waitlist(db, payload.doctor_id)
    return result
