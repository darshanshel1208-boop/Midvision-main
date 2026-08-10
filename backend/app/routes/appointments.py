from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models import User, Patient, Doctor, Appointment, AppointmentSlot, DoctorLeave, Notification
from app.services.auth_service import get_current_user, get_optional_current_user
from app.services.appointment_service import (
    DoctorMatchingEngine, AppointmentBookingService, SpecialtyRecommendationService
)
from app.services.slot_engine import SlotEngine
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import datetime

router = APIRouter(prefix="/api/appointments", tags=["Appointments & Scheduling Engine"])

class BookAppointmentRequest(BaseModel):
    slot_id: str
    urgency: str = "normal"
    report_id: Optional[str] = None

class CancelAppointmentRequest(BaseModel):
    reason: str = "User requested cancellation"

class RescheduleAppointmentRequest(BaseModel):
    new_slot_id: str

class BlockSlotRequest(BaseModel):
    slot_id: str
    reason: Optional[str] = "Blocked by doctor"

class DoctorLeaveRequest(BaseModel):
    doctor_id: str
    start_date: str # "YYYY-MM-DD"
    end_date: str   # "YYYY-MM-DD"
    reason: Optional[str] = "Personal leave"

class PatientPreferenceRequest(BaseModel):
    preferred_time_of_day: Optional[str] = None # morning, afternoon, evening
    preferred_doctor_id: Optional[str] = None
    preferred_hospital_id: Optional[str] = None
    preferred_language: Optional[str] = "English"

@router.get("/recommendations")
def get_recommendations(
    specialty: str = Query(..., description="The medical specialty required"),
    urgency: str = Query("normal", description="Patient priority level (normal, urgent, emergency, follow_up)"),
    hospital_id: Optional[str] = Query(None),
    report_id: Optional[str] = Query(None),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    patient_id = current_user.patient_profile.id if (current_user and current_user.patient_profile) else None
    ranked_slots = DoctorMatchingEngine.get_ranked_slots(
        db=db,
        required_specialty=specialty,
        urgency=urgency,
        patient_id=patient_id,
        hospital_id=hospital_id
    )
    
    ai_recommendation = None
    if report_id:
        ai_recommendation = SpecialtyRecommendationService.recommend_specialty_from_report(db, report_id)

    return {
        "success": True,
        "specialty": specialty,
        "urgency": urgency,
        "ai_recommendation": ai_recommendation,
        "slots": ranked_slots,
        "count": len(ranked_slots)
    }

@router.get("/specialty-recommendation/{report_id}")
def get_specialty_recommendation(
    report_id: str,
    db: Session = Depends(get_db)
):
    rec = SpecialtyRecommendationService.recommend_specialty_from_report(db, report_id)
    return {"success": True, "data": rec}

@router.post("/book")
def book_appointment(
    req: BookAppointmentRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    patient_id = None
    if current_user and current_user.patient_profile:
        patient_id = current_user.patient_profile.id
    else:
        # Get or create fallback patient profile
        demo_patient = db.query(Patient).first()
        if not demo_patient:
            demo_user = User(email="patient@medivision.com", hashed_password="pwd", full_name="Patient User", role="patient")
            db.add(demo_user)
            db.flush()
            demo_patient = Patient(user_id=demo_user.id)
            db.add(demo_patient)
            db.commit()
        patient_id = demo_patient.id

    try:
        appointment = AppointmentBookingService.book_appointment(
            db=db,
            patient_id=patient_id,
            slot_id=req.slot_id,
            urgency=req.urgency,
            report_id=req.report_id
        )
        return {
            "success": True,
            "message": "Appointment booked successfully",
            "appointment_id": appointment.id,
            "scheduled_time": appointment.scheduled_time.isoformat()
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/my-appointments")
def list_my_appointments(
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Appointment)
    if current_user:
        if current_user.role == "patient" and current_user.patient_profile:
            query = query.filter(Appointment.patient_id == current_user.patient_profile.id)
        elif current_user.role == "doctor" and current_user.doctor_profile:
            query = query.filter(Appointment.doctor_id == current_user.doctor_profile.id)

    appts = query.order_by(Appointment.scheduled_time.desc()).all()
    results = []
    for a in appts:
        wait_info = DoctorMatchingEngine.calculate_wait_time(db, a.doctor_id, a.scheduled_time)
        results.append({
            "id": a.id,
            "doctor_id": a.doctor_id,
            "doctor_name": a.doctor.user.full_name if (a.doctor and a.doctor.user) else "Dr. Unknown",
            "specialty": a.doctor.specialty if a.doctor else "",
            "scheduled_time": a.scheduled_time.isoformat(),
            "status": a.status,
            "urgency_level": a.urgency_level,
            "estimated_wait_minutes": wait_info["estimated_wait_minutes"],
            "queue_position": wait_info["queue_position"],
            "report_id": a.report_id
        })
    return {"success": True, "appointments": results}

@router.post("/{appointment_id}/cancel")
def cancel_appointment(
    appointment_id: str,
    req: CancelAppointmentRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    try:
        user_id = current_user.id if current_user else "guest_user"
        appt = AppointmentBookingService.cancel_appointment(
            db=db,
            appointment_id=appointment_id,
            cancelled_by_user_id=user_id,
            reason=req.reason
        )
        return {"success": True, "message": "Appointment cancelled successfully", "appointment_id": appt.id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{appointment_id}/reschedule")
def reschedule_appointment(
    appointment_id: str,
    req: RescheduleAppointmentRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    try:
        user_id = current_user.id if current_user else "guest_user"
        appt = AppointmentBookingService.reschedule_appointment(
            db=db,
            appointment_id=appointment_id,
            new_slot_id=req.new_slot_id,
            user_id=user_id
        )
        return {
            "success": True,
            "message": "Appointment rescheduled successfully",
            "appointment_id": appt.id,
            "new_time": appt.scheduled_time.isoformat()
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/alternatives")
def get_alternatives(
    doctor_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    alternatives = AppointmentBookingService.get_alternative_recommendations(db, doctor_id)
    return {"success": True, "alternatives": alternatives}

@router.get("/my-appointments")
def list_my_appointments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Appointment)
    if current_user.role == "patient" and current_user.patient_profile:
        query = query.filter(Appointment.patient_id == current_user.patient_profile.id)
    elif current_user.role == "doctor" and current_user.doctor_profile:
        query = query.filter(Appointment.doctor_id == current_user.doctor_profile.id)

    appts = query.order_by(Appointment.scheduled_time.desc()).all()
    results = []
    for a in appts:
        wait_info = DoctorMatchingEngine.calculate_wait_time(db, a.doctor_id, a.scheduled_time)
        results.append({
            "id": a.id,
            "doctor_id": a.doctor_id,
            "doctor_name": a.doctor.user.full_name if a.doctor and a.doctor.user else "Dr. Unknown",
            "specialty": a.doctor.specialty if a.doctor else "",
            "scheduled_time": a.scheduled_time.isoformat(),
            "status": a.status,
            "urgency_level": a.urgency_level,
            "estimated_wait_minutes": wait_info["estimated_wait_minutes"],
            "queue_position": wait_info["queue_position"],
            "report_id": a.report_id
        })
    return {"success": True, "appointments": results}

@router.get("/doctor-schedule/{doctor_id}")
def get_doctor_schedule(
    doctor_id: str,
    date_str: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    slots = SlotEngine.get_available_slots(db, doctor_id, date_str)
    return {"success": True, "doctor_id": doctor_id, "slots": slots}

@router.post("/slots/block")
def block_slot(
    req: BlockSlotRequest,
    db: Session = Depends(get_db)
):
    slot = db.query(AppointmentSlot).filter(AppointmentSlot.id == req.slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found.")

    slot.status = "BLOCKED"
    slot.is_booked = True
    db.commit()
    return {"success": True, "message": f"Slot blocked successfully ({req.reason})"}

@router.post("/leave")
def request_doctor_leave(
    req: DoctorLeaveRequest,
    db: Session = Depends(get_db)
):
    try:
        start = datetime.datetime.strptime(req.start_date, "%Y-%m-%d")
        end = datetime.datetime.strptime(req.end_date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    leave = DoctorLeave(
        doctor_id=req.doctor_id,
        start_date=start,
        end_date=end,
        reason=req.reason
    )
    db.add(leave)

    # Block existing slots during leave range
    db.query(AppointmentSlot).filter(
        AppointmentSlot.doctor_id == req.doctor_id,
        AppointmentSlot.start_time >= start,
        AppointmentSlot.start_time <= end
    ).update({"status": "BLOCKED", "is_booked": True}, synchronize_session=False)

    db.commit()
    return {"success": True, "message": "Doctor leave recorded and conflicting slots blocked."}

@router.get("/dashboard-stats")
def get_dashboard_stats(
    db: Session = Depends(get_db)
):
    now = datetime.datetime.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + datetime.timedelta(days=1)

    total_today = db.query(Appointment).filter(
        Appointment.scheduled_time >= today_start,
        Appointment.scheduled_time < today_end
    ).count()

    urgent_count = db.query(Appointment).filter(
        Appointment.urgency_level.in_(["urgent", "emergency"])
    ).count()

    doctors = db.query(Doctor).filter(Doctor.is_active == True).all()
    workload = []
    for doc in doctors:
        count = db.query(Appointment).filter(
            Appointment.doctor_id == doc.id,
            Appointment.scheduled_time >= today_start,
            Appointment.scheduled_time < today_end
        ).count()
        workload.append({
            "id": doc.id,
            "name": doc.user.full_name if doc.user else "Unknown Doctor",
            "specialty": doc.specialty,
            "appointments": count,
            "status": "Overloaded" if count > 8 else ("Busy" if count > 4 else "Available")
        })

    specialties = ["Cardiologist", "Pulmonologist", "Neurologist", "General Physician", "Oncologist"]
    availability = []
    for spec in specialties:
        available_slots = db.query(AppointmentSlot).join(Doctor).filter(
            Doctor.specialty.ilike(f"%{spec}%"),
            AppointmentSlot.is_booked == False,
            AppointmentSlot.status == "AVAILABLE",
            AppointmentSlot.start_time > now
        ).count()
        availability.append({"specialty": spec, "slots": available_slots})

    recent_allocations = db.query(Appointment).order_by(Appointment.created_at.desc()).limit(5).all()
    recent = []
    for appt in recent_allocations:
        recent.append({
            "id": appt.id,
            "patient_id": appt.patient_id,
            "doctor": appt.doctor.user.full_name if appt.doctor and appt.doctor.user else "Doctor",
            "specialty": appt.doctor.specialty if appt.doctor else "",
            "time": appt.scheduled_time.isoformat(),
            "urgency": appt.urgency_level,
            "status": appt.status
        })

    return {
        "success": True,
        "metrics": {
            "total_today": total_today,
            "urgent_cases": urgent_count,
            "avg_wait_time": "18 mins",
            "predicted_no_show": "8.5%"
        },
        "workload": sorted(workload, key=lambda x: x["appointments"], reverse=True),
        "availability": availability,
        "recent_allocations": recent
    }
