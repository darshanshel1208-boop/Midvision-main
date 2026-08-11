import sys
import os
import pytest
import datetime
from concurrent.futures import ThreadPoolExecutor
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.database.database import Base, engine, SessionLocal
from app.models import Doctor, User, Hospital, Patient, AppointmentSlot, Appointment
from app.services.slot_engine import SlotEngine
from app.services.appointment_service import DoctorMatchingEngine, AppointmentBookingService

client = TestClient(app)

def test_list_doctors():
    response = client.get("/api/doctors/")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    assert "data" in json_data
    assert isinstance(json_data["data"], list)

def test_get_doctor_by_id():
    db = SessionLocal()
    doc = db.query(Doctor).first()
    db.close()
    if doc:
        response = client.get(f"/api/doctors/{doc.id}")
        assert response.status_code == 200
        json_data = response.json()
        assert json_data["success"] is True
        assert json_data["data"]["id"] == doc.id

def test_slot_engine_generation():
    db = SessionLocal()
    doc = db.query(Doctor).first()
    if doc:
        slots = SlotEngine.generate_slots_for_doctor(db, doc.id, days_ahead=2)
        assert len(slots) > 0
        avail = SlotEngine.get_available_slots(db, doc.id)
        assert len(avail) > 0
    db.close()

def test_appointment_ranking():
    db = SessionLocal()
    ranked = DoctorMatchingEngine.get_ranked_slots(db, required_specialty="Cardiologist", urgency="normal")
    assert isinstance(ranked, list)
    if len(ranked) > 1:
        assert ranked[0]["score"] >= ranked[1]["score"]
    db.close()

def test_booking_and_cancellation():
    db = SessionLocal()
    patient = db.query(Patient).first()
    if not patient:
        # Create a test patient
        user = User(email="testpatient@medivision.com", hashed_password="pwd", full_name="Test Patient", role="patient")
        db.add(user)
        db.flush()
        patient = Patient(user_id=user.id)
        db.add(patient)
        db.commit()

    slot = db.query(AppointmentSlot).filter(AppointmentSlot.is_booked == False, AppointmentSlot.status == "AVAILABLE").first()
    if slot:
        # Book appointment
        appt = AppointmentBookingService.book_appointment(db, patient.id, slot.id, urgency="normal")
        assert appt.id is not None
        assert appt.status == "scheduled"
        
        # Check slot is booked
        updated_slot = db.query(AppointmentSlot).filter(AppointmentSlot.id == slot.id).first()
        assert updated_slot.is_booked is True

        # Cancel appointment
        cancelled = AppointmentBookingService.cancel_appointment(db, appt.id, patient.user_id, "Testing cancellation")
        assert cancelled.status == "cancelled"

        # Check slot is released back to AVAILABLE
        released_slot = db.query(AppointmentSlot).filter(AppointmentSlot.id == slot.id).first()
        assert released_slot.is_booked is False
        assert released_slot.status == "AVAILABLE"

    db.close()

def test_double_booking_prevention():
    """Critical Test: Concurrent booking of the same slot must fail for all except ONE."""
    db = SessionLocal()
    patient = db.query(Patient).first()
    slot = db.query(AppointmentSlot).filter(AppointmentSlot.is_booked == False, AppointmentSlot.status == "AVAILABLE").first()
    
    if patient and slot:
        successes = []
        failures = []

        def attempt_booking():
            session = SessionLocal()
            try:
                AppointmentBookingService.book_appointment(session, patient.id, slot.id)
                successes.append(True)
            except ValueError:
                failures.append(True)
            finally:
                session.close()

        with ThreadPoolExecutor(max_workers=2) as executor:
            f1 = executor.submit(attempt_booking)
            f2 = executor.submit(attempt_booking)
            f1.result()
            f2.result()

        assert len(successes) == 1, f"Expected exactly 1 booking success, got {len(successes)}"
        assert len(failures) == 1, f"Expected 1 booking failure, got {len(failures)}"

    db.close()
