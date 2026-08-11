from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.core import User, MedicalReport, Prediction
from app.services.auth_service import get_current_user
import json

router = APIRouter(prefix="/api/reports", tags=["Reports"])

@router.post("/upload")
async def upload_report(
    file: UploadFile = File(...), 
    report_type: str = Form(...),
    description: str = Form(""),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Mock AI Processing based on type (would normally call app/ai_models/)
    result_data = {}
    specialty = "General Physician"
    
    if report_type == "blood":
        result_data = {"risk": "Low", "findings": ["Hemoglobin normal", "WBC normal"], "score": 92}
    elif report_type == "xray":
        result_data = {"risk": "Medium", "findings": ["Mild pleural effusion detected", "No consolidation"], "score": 75}
        specialty = "Pulmonologist"
    elif report_type == "mri":
        result_data = {"risk": "Critical", "findings": ["Hyperintense lesion in temporal lobe", "Mass effect with midline shift", "High probability of Glioblastoma"], "score": 12}
        specialty = "Neurologist"
    elif report_type == "ct":
        result_data = {"risk": "High", "findings": ["Pulmonary nodule detected", "Requires immediate review"], "score": 45}
        specialty = "Oncologist"
    elif report_type == "ecg":
        result_data = {"risk": "Medium", "findings": ["Sinus Tachycardia", "Minor ST elevation"], "score": 70}
        specialty = "Cardiologist"
    else:
        result_data = {"risk": "Unknown", "findings": ["Analysis completed"], "score": 80}
        
    report = MedicalReport(
        user_id=current_user.id,
        report_type=report_type,
        filename=file.filename,
        result_data=json.dumps(result_data)
    )
    db.add(report)
    db.flush()
    
    prediction = Prediction(
        report_id=report.id,
        ai_model=f"mock_{report_type}_model_v1",
        confidence_score=0.92,
        findings=json.dumps(result_data["findings"]),
        risk_level=result_data["risk"],
        recommended_specialty=specialty
    )
    db.add(prediction)
    db.flush()

    # Feature: Risk-Based Appointment Auto-Trigger Engine
    # If report says risky (High/Critical/Risky/Emergency) -> Urgent Appointment Booking
    # If report says medium (Medium/Moderate) -> Book Appointment Suggestion
    risk_upper = str(result_data["risk"]).upper()
    auto_urgent_booking = None
    appointment_suggestion = None

    from app.models.core import Doctor, Patient
    from app.models.sih1383 import AppointmentSlot, Appointment, Notification
    from app.models.presence import DoctorWaitlist, DoctorPresence
    import datetime

    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    patient_id = patient.id if patient else None

    if risk_upper in ["HIGH", "CRITICAL", "RISKY", "EMERGENCY"]:
        # Find matching specialist
        doctor = db.query(Doctor).filter(Doctor.specialty == specialty, Doctor.is_active == True).first()
        if not doctor:
            doctor = db.query(Doctor).filter(Doctor.is_active == True).first()

        if doctor and patient_id:
            # Auto-book next available slot or create urgent waitlist entry
            slot = db.query(AppointmentSlot).filter(
                AppointmentSlot.doctor_id == doctor.id,
                AppointmentSlot.status == "AVAILABLE"
            ).order_by(AppointmentSlot.start_time.asc()).first()

            if not slot:
                # Dynamically generate urgent slot
                now = datetime.datetime.utcnow()
                slot_start = now + datetime.timedelta(minutes=15)
                slot_end = slot_start + datetime.timedelta(minutes=30)
                slot = AppointmentSlot(doctor_id=doctor.id, start_time=slot_start, end_time=slot_end, status="AVAILABLE")
                db.add(slot)
                db.flush()

            slot.status = "BOOKED"
            slot.is_booked = True

            appt = Appointment(
                patient_id=patient_id,
                doctor_id=doctor.id,
                slot_id=slot.id,
                report_id=report.id,
                scheduled_time=slot.start_time,
                status="scheduled",
                urgency_level="emergency",
                type="consultation"
            )
            db.add(appt)
            db.flush()

            # Create notification
            notif = Notification(
                user_id=current_user.id,
                appointment_id=appt.id,
                notification_type="appointment_booked",
                message=f"🚨 URGENT APPOINTMENT AUTOMATICALLY BOOKED! High-risk findings in {report_type.upper()} report. Specialist appointment set for {slot.start_time.strftime('%H:%M')}."
            )
            db.add(notif)

            auto_urgent_booking = {
                "booked": True,
                "appointment_id": appt.id,
                "doctor_id": doctor.id,
                "urgency_level": "EMERGENCY",
                "scheduled_time": slot.start_time.strftime("%Y-%m-%d %H:%M"),
                "recommended_specialty": specialty,
                "message": f"Critical/Risky report findings detected! Urgent appointment automatically booked with {specialty} specialist."
            }
    elif risk_upper in ["MEDIUM", "MODERATE"]:
        appointment_suggestion = {
            "suggested": True,
            "urgency_level": "NORMAL",
            "recommended_specialty": specialty,
            "message": f"Moderate risk detected in {report_type.upper()} report. Booking a consultation with a {specialty} specialist is recommended."
        }

    db.commit()
    db.refresh(report)
    
    return {
        "message": "Report analyzed successfully",
        "report_id": report.id,
        "result": result_data,
        "recommended_specialty": specialty,
        "auto_urgent_booking": auto_urgent_booking,
        "appointment_suggestion": appointment_suggestion
    }

@router.get("/")
def get_reports(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    reports = db.query(MedicalReport).filter(MedicalReport.user_id == current_user.id).order_by(MedicalReport.created_at.desc()).all()
    return [{"id": r.id, "type": r.report_type, "filename": r.filename, "date": r.created_at.isoformat(), "result": json.loads(r.result_data) if r.result_data else {}} for r in reports]

@router.post("/ocr")
async def extract_prescription(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from app.models.core import Prescription, Medicine
    
    # Mock OCR Extraction
    extracted_medicines = [
        {"name": "Amoxicillin 500mg", "dosage": "1 tablet", "schedule": "1-0-1 (Morning & Night)", "duration": "5 Days"},
        {"name": "Paracetamol 650mg", "dosage": "1 tablet", "schedule": "1-1-1 (After meals)", "duration": "3 Days"},
        {"name": "Cetirizine 10mg", "dosage": "1 tablet", "schedule": "0-0-1 (Night)", "duration": "5 Days"}
    ]
    
    # Save to DB
    prescription = Prescription(user_id=current_user.id, filename=file.filename)
    db.add(prescription)
    db.flush()
    
    for med in extracted_medicines:
        medicine = Medicine(
            prescription_id=prescription.id,
            name=med["name"],
            dosage=med["dosage"],
            schedule=med["schedule"],
            duration=med["duration"]
        )
        db.add(medicine)
        
    db.commit()
    db.refresh(prescription)
    
    return {
        "message": "Prescription extracted successfully",
        "prescription_id": prescription.id,
        "medicines": extracted_medicines
    }
