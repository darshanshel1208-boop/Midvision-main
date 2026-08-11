import sys
import os
import pytest
import datetime
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.database.database import Base, engine, SessionLocal
from app.models.core import Doctor, User, Patient, MedicalReport, Prediction
from app.models.presence import DoctorPresence, DoctorWaitlist, PresenceSensorLog
from app.services.presence_service import PresenceService
from app.services.ai_slot_allocator import AISlotAllocator

client = TestClient(app)

def setup_module(module):
    """Ensure DB is initialized for presence tests."""
    from reset_db import reset_and_seed
    reset_and_seed()

def test_rfid_presence_event():
    db = SessionLocal()
    presence = db.query(DoctorPresence).first()
    db.close()
    
    assert presence is not None
    rfid_tag = presence.rfid_tag_id
    
    # Test RFID Enter
    response = client.post("/presence/rfid", json={
        "rfid_tag_id": rfid_tag,
        "room_number": "OPD Cabin 101",
        "action": "ENTER",
        "reader_id": "RFID-READER-TEST"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["status"] == "PRESENT"
    assert data["detection_method"] == "RFID"

def test_face_detection_event():
    db = SessionLocal()
    presence = db.query(DoctorPresence).first()
    db.close()
    
    face_id = presence.face_id
    
    response = client.post("/presence/face-detection", json={
        "face_id": face_id,
        "confidence_score": 0.96,
        "room_number": "OPD Cabin 101",
        "camera_id": "CAM-DOOR-TEST"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["status"] == "PRESENT"
    assert data["detection_method"] == "FACE_DETECTION"

def test_mobile_proximity_event():
    db = SessionLocal()
    presence = db.query(DoctorPresence).first()
    db.close()
    
    mob_id = presence.mobile_device_id
    
    # Send distance <= 5m -> PRESENT
    response = client.post("/presence/mobile-proximity", json={
        "mobile_device_id": mob_id,
        "distance_meters": 2.5,
        "beacon_id": "BLE-BEACON-TEST"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["status"] == "PRESENT"

    # Send distance > 15m -> ABSENT
    response_absent = client.post("/presence/mobile-proximity", json={
        "mobile_device_id": mob_id,
        "distance_meters": 25.0,
        "beacon_id": "BLE-BEACON-TEST"
    })
    assert response_absent.status_code == 200
    data_absent = response_absent.json()
    assert data_absent["status"] == "ABSENT"

def test_get_doctor_presences_and_logs():
    res_docs = client.get("/presence/doctors")
    assert res_docs.status_code == 200
    docs_data = res_docs.json()
    assert "doctors" in docs_data
    assert len(docs_data["doctors"]) > 0

    res_logs = client.get("/presence/logs?limit=10")
    assert res_logs.status_code == 200
    logs_data = res_logs.json()
    assert "logs" in logs_data
    assert len(logs_data["logs"]) > 0

def test_ai_waitlist_priority_scoring_and_allocation():
    db = SessionLocal()
    doctor = db.query(Doctor).first()
    patient = db.query(Patient).first()
    
    waitlist_item = DoctorWaitlist(
        patient_id=patient.id,
        doctor_id=doctor.id,
        specialty_required=doctor.specialty,
        urgency_level="EMERGENCY",
        symptoms="Test emergency symptoms",
        status="WAITLISTED",
        priority_score=1.0,
        requested_at=datetime.datetime.utcnow()
    )
    db.add(waitlist_item)
    db.commit()
    db.refresh(waitlist_item)
    score = AISlotAllocator.calculate_patient_priority_score(waitlist_item)
    assert score >= 100.0 # EMERGENCY base weight is 100

    # First set doctor status to ABSENT so transition to PRESENT fires auto-allocation
    PresenceService.manual_override_status(db, doctor.id, "ABSENT")

    # Override to PRESENT - this automatically triggers AI Waitlist Slot Allocation!
    result = PresenceService.manual_override_status(db, doctor.id, "PRESENT")
    assert result["success"] is True
    assert result["ai_allocation"] is not None
    assert result["ai_allocation"]["allocated"] is True
    assert result["ai_allocation"]["allocated_count"] >= 1
    db.close()
