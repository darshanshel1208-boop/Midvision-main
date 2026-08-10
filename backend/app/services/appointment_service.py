from sqlalchemy.orm import Session
from app.models import (
    AppointmentSlot, Appointment, Doctor, Patient, Hospital,
    PatientPreference, DoctorLeave, Notification, AppointmentPrediction,
    WaitTimePrediction, DoctorSpecialization, MedicalReport, Prediction
)
from app.services.slot_engine import SlotEngine
import datetime
import uuid
from typing import List, Dict, Optional, Any

# Configurable Scoring Weights for SIH1383 AI Allocation Engine
DEFAULT_WEIGHTS = {
    "SPECIALTY_WEIGHT": 0.40,
    "AVAILABILITY_WEIGHT": 0.20,
    "URGENCY_WEIGHT": 0.15,
    "PREFERENCE_WEIGHT": 0.10,
    "WORKLOAD_WEIGHT": 0.10,
    "WAIT_TIME_WEIGHT": 0.05
}

class SpecialtyRecommendationService:
    """
    Phase 5: Connects AI medical report/imaging analysis with appointment scheduling.
    Outputs decision-support recommended specialties, confidence scores, and rationales.
    """
    
    SPECIALTY_MAPPINGS = {
        "xray": {"specialty": "Pulmonologist", "confidence": 0.92, "reason": "Imaging shows potential pulmonary parenchymal or pleural abnormality."},
        "ecg": {"specialty": "Cardiologist", "confidence": 0.88, "reason": "Electrocardiogram indicates potential cardiac arrhythmia or ischemia pattern."},
        "mri": {"specialty": "Neurologist", "confidence": 0.95, "reason": "Brain/Spine MRI findings suggest central nervous system evaluation."},
        "ct": {"specialty": "Oncologist", "confidence": 0.90, "reason": "Cross-sectional CT scan highlights lesion requiring targeted specialist review."},
        "blood": {"specialty": "General Physician", "confidence": 0.85, "reason": "Blood panel parameters flag system metabolic/hematologic review requirement."}
    }

    @staticmethod
    def recommend_specialty_from_report(db: Session, report_id: str) -> Dict[str, Any]:
        report = db.query(MedicalReport).filter(MedicalReport.id == report_id).first()
        if not report:
            return {
                "recommended_specialty": "General Physician",
                "confidence": 0.50,
                "reason": "Report not found, defaulting to General Medicine.",
                "alternatives": ["General Physician", "Internal Medicine"]
            }

        prediction = db.query(Prediction).filter(Prediction.report_id == report_id).first()
        if prediction and prediction.recommended_specialty:
            return {
                "recommended_specialty": prediction.recommended_specialty,
                "confidence": prediction.confidence_score or 0.90,
                "reason": f"AI model ({prediction.ai_model}) detected {prediction.risk_level} risk findings.",
                "findings": prediction.findings,
                "source_analysis": report.report_type
            }

        mapping = SpecialtyRecommendationService.SPECIALTY_MAPPINGS.get(
            report.report_type.lower(),
            {"specialty": "General Physician", "confidence": 0.70, "reason": "Standard clinical evaluation recommended."}
        )
        return {
            "recommended_specialty": mapping["specialty"],
            "confidence": mapping["confidence"],
            "reason": mapping["reason"],
            "source_analysis": report.report_type
        }

class DoctorMatchingEngine:
    """
    Phase 6 & 7: Doctor Matching & AI Appointment Scoring Engine.
    Matches doctors based on:
    1. Specialty match
    2. Availability
    3. Hospital/Location
    4. Patient preferences
    5. Workload balance
    6. Appointment urgency
    7. Wait time efficiency
    """

    @staticmethod
    def calculate_wait_time(db: Session, doctor_id: str, scheduled_time: datetime.datetime) -> Dict[str, Any]:
        """
        Phase 9: Rule-based waiting time estimation based on doctor queue depth and average consultation time.
        """
        today_start = scheduled_time.replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + datetime.timedelta(days=1)

        prior_appointments = db.query(Appointment).filter(
            Appointment.doctor_id == doctor_id,
            Appointment.scheduled_time >= today_start,
            Appointment.scheduled_time < scheduled_time,
            Appointment.status.in_(["scheduled", "in_consultation"])
        ).count()

        doc = db.query(Doctor).filter(Doctor.id == doctor_id).first()
        duration = doc.consultation_duration_minutes if doc else 30

        estimated_wait = prior_appointments * duration
        estimated_start = scheduled_time + datetime.timedelta(minutes=estimated_wait)

        return {
            "queue_position": prior_appointments + 1,
            "estimated_wait_minutes": estimated_wait,
            "estimated_start_time": estimated_start.isoformat(),
            "consultation_duration": duration
        }

    @staticmethod
    def score_appointment_slot(
        db: Session,
        slot: AppointmentSlot,
        required_specialty: str,
        urgency: str = "normal",
        patient_id: Optional[str] = None,
        preferred_hospital_id: Optional[str] = None,
        weights: Dict[str, float] = DEFAULT_WEIGHTS
    ) -> float:
        now = datetime.datetime.now()
        doctor = slot.doctor

        # 1. Specialty Match Score (0 - 100)
        doc_specs = [s.specialization.lower() for s in doctor.specializations] if doctor.specializations else [doctor.specialty.lower()]
        if required_specialty.lower() in doc_specs or doctor.specialty.lower() == required_specialty.lower():
            specialty_score = 100.0
        else:
            specialty_score = 50.0

        # 2. Availability Score (0 - 100)
        hours_until = (slot.start_time - now).total_seconds() / 3600
        if hours_until <= 24:
            availability_score = 100.0
        elif hours_until <= 72:
            availability_score = 80.0
        else:
            availability_score = max(20.0, 100.0 - (hours_until - 72))

        # 3. Urgency / Priority Boost
        if urgency.lower() == "emergency":
            urgency_score = max(0.0, 100.0 - (hours_until * 5.0))
        elif urgency.lower() == "urgent":
            urgency_score = max(0.0, 100.0 - (hours_until * 2.0))
        else:
            urgency_score = 70.0

        # 4. Patient Preference Score
        preference_score = 50.0
        if patient_id:
            pref = db.query(PatientPreference).filter(PatientPreference.patient_id == patient_id).first()
            if pref:
                if pref.preferred_doctor_id == doctor.id:
                    preference_score += 30.0
                if pref.preferred_hospital_id and doctor.hospital_id == pref.preferred_hospital_id:
                    preference_score += 20.0
                if pref.preferred_time_of_day:
                    slot_hour = slot.start_time.hour
                    if pref.preferred_time_of_day == "morning" and 8 <= slot_hour < 12:
                        preference_score += 20.0
                    elif pref.preferred_time_of_day == "afternoon" and 12 <= slot_hour < 17:
                        preference_score += 20.0
                    elif pref.preferred_time_of_day == "evening" and 17 <= slot_hour < 21:
                        preference_score += 20.0

        if preferred_hospital_id and doctor.hospital_id == preferred_hospital_id:
            preference_score = min(100.0, preference_score + 20.0)

        # 5. Doctor Workload Balance Score
        upcoming_count = db.query(Appointment).filter(
            Appointment.doctor_id == doctor.id,
            Appointment.status == "scheduled"
        ).count()
        workload_score = max(0.0, 100.0 - (upcoming_count * 8.0))

        # 6. Wait Time Efficiency Score
        wait_info = DoctorMatchingEngine.calculate_wait_time(db, doctor.id, slot.start_time)
        wait_minutes = wait_info["estimated_wait_minutes"]
        wait_time_score = max(0.0, 100.0 - (wait_minutes * 2.0))

        # Doctor Rating Factor (adds up to 10 points bonus)
        rating_bonus = (doctor.rating or 5.0) * 2.0

        total_score = (
            specialty_score * weights["SPECIALTY_WEIGHT"] +
            availability_score * weights["AVAILABILITY_WEIGHT"] +
            urgency_score * weights["URGENCY_WEIGHT"] +
            preference_score * weights["PREFERENCE_WEIGHT"] +
            workload_score * weights["WORKLOAD_WEIGHT"] +
            wait_time_score * weights["WAIT_TIME_WEIGHT"] +
            rating_bonus
        )

        return round(total_score, 2)

    @staticmethod
    def get_ranked_slots(
        db: Session,
        required_specialty: str,
        urgency: str = "normal",
        patient_id: Optional[str] = None,
        hospital_id: Optional[str] = None,
        custom_weights: Optional[Dict[str, float]] = None
    ) -> List[Dict[str, Any]]:
        weights = DEFAULT_WEIGHTS.copy()
        if custom_weights:
            weights.update(custom_weights)

        now = datetime.datetime.now()
        end_date = now + datetime.timedelta(days=7)

        # Generate fresh slots for all matching doctors
        matching_doctors = db.query(Doctor).filter(
            Doctor.specialty.ilike(f"%{required_specialty}%"),
            Doctor.is_active == True
        ).all()

        for doc in matching_doctors:
            SlotEngine.generate_slots_for_doctor(db, doc.id, days_ahead=7)

        query = db.query(AppointmentSlot).join(Doctor).filter(
            Doctor.specialty.ilike(f"%{required_specialty}%"),
            Doctor.is_active == True,
            AppointmentSlot.is_booked == False,
            AppointmentSlot.status == "AVAILABLE",
            AppointmentSlot.start_time > now,
            AppointmentSlot.start_time < end_date
        )

        if hospital_id:
            query = query.filter(Doctor.hospital_id == hospital_id)

        available_slots = query.all()
        scored_slots = []

        for slot in available_slots:
            score = DoctorMatchingEngine.score_appointment_slot(
                db, slot, required_specialty, urgency, patient_id, hospital_id, weights
            )
            wait_data = DoctorMatchingEngine.calculate_wait_time(db, slot.doctor_id, slot.start_time)

            scored_slots.append({
                "slot_id": slot.id,
                "doctor_id": slot.doctor.id,
                "doctor_name": slot.doctor.user.full_name if slot.doctor.user else "Dr. Unknown",
                "doctor_specialty": slot.doctor.specialty,
                "hospital_id": slot.doctor.hospital_id,
                "hospital_name": slot.doctor.hospital.name if slot.doctor.hospital else None,
                "rating": slot.doctor.rating,
                "experience_years": slot.doctor.experience_years,
                "is_emergency_available": slot.doctor.is_emergency_available,
                "start_time": slot.start_time.isoformat(),
                "end_time": slot.end_time.isoformat(),
                "score": score,
                "estimated_wait_minutes": wait_data["estimated_wait_minutes"],
                "queue_position": wait_data["queue_position"]
            })

        scored_slots.sort(key=lambda x: x["score"], reverse=True)
        return scored_slots


class AppointmentBookingService:
    """
    Phases 10, 11, 12, 13: Booking, Cancellation, Rescheduling, Alternative Slot Recommendation.
    Ensures atomic double-booking prevention using DB transactions.
    """

    @staticmethod
    def book_appointment(
        db: Session,
        patient_id: str,
        slot_id: str,
        urgency: str = "normal",
        report_id: Optional[str] = None
    ) -> Appointment:
        # Atomic compare-and-swap lock & validation for concurrency safety across SQLite & PostgreSQL
        updated_rows = db.query(AppointmentSlot).filter(
            AppointmentSlot.id == slot_id,
            AppointmentSlot.is_booked == False,
            AppointmentSlot.status == "AVAILABLE"
        ).update({"is_booked": True, "status": "BOOKED"}, synchronize_session=False)

        if updated_rows == 0:
            db.rollback()
            raise ValueError("Requested appointment slot is no longer available or already booked.")

        slot = db.query(AppointmentSlot).filter(AppointmentSlot.id == slot_id).first()

        # Re-check doctor leave on slot date
        leave_conflict = db.query(DoctorLeave).filter(
            DoctorLeave.doctor_id == slot.doctor_id,
            DoctorLeave.start_date <= slot.start_time,
            DoctorLeave.end_date >= slot.start_time
        ).first()

        if leave_conflict:
            # Revert slot status if doctor is on leave
            slot.is_booked = False
            slot.status = "BLOCKED"
            db.commit()
            raise ValueError("Doctor is on leave during the selected time slot.")

        appointment = Appointment(
            patient_id=patient_id,
            doctor_id=slot.doctor_id,
            hospital_id=slot.doctor.hospital_id,
            slot_id=slot.id,
            report_id=report_id,
            scheduled_time=slot.start_time,
            status="scheduled",
            urgency_level=urgency
        )

        db.add(appointment)
        db.flush()

        # Phase 15: Generate baseline No-Show Prediction
        no_show_prob = 0.05
        if urgency == "follow_up":
            no_show_prob = 0.12
        elif (slot.start_time - datetime.datetime.now()).days > 5:
            no_show_prob = 0.15

        prediction = AppointmentPrediction(
            appointment_id=appointment.id,
            no_show_probability=no_show_prob,
            predicted_wait_time_mins=15
        )
        db.add(prediction)

        # Phase 16: Trigger Notification
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if patient and patient.user_id:
            notif = Notification(
                user_id=patient.user_id,
                appointment_id=appointment.id,
                notification_type="appointment_booked",
                message=f"Appointment confirmed with {slot.doctor.user.full_name if slot.doctor.user else 'Doctor'} on {slot.start_time.strftime('%b %d, %Y at %I:%M %p')}."
            )
            db.add(notif)

        db.commit()
        db.refresh(appointment)
        return appointment

    @staticmethod
    def cancel_appointment(
        db: Session,
        appointment_id: str,
        cancelled_by_user_id: str,
        reason: str = "User requested cancellation"
    ) -> Appointment:
        """Phase 11: Cancellation engine releasing slot and updating queue."""
        appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
        if not appt:
            raise ValueError("Appointment not found")

        if appt.status == "cancelled":
            return appt

        appt.status = "cancelled"
        appt.cancelled_at = datetime.datetime.utcnow()
        appt.cancelled_by = cancelled_by_user_id
        appt.cancellation_reason = reason

        # Release associated slot
        if appt.slot_id:
            slot = db.query(AppointmentSlot).filter(AppointmentSlot.id == appt.slot_id).first()
            if slot:
                slot.is_booked = False
                slot.status = "AVAILABLE"

        # Notify user
        if appt.patient and appt.patient.user_id:
            notif = Notification(
                user_id=appt.patient.user_id,
                appointment_id=appt.id,
                notification_type="cancellation",
                message=f"Your appointment scheduled for {appt.scheduled_time.strftime('%b %d, %I:%M %p')} has been cancelled."
            )
            db.add(notif)

        db.commit()
        db.refresh(appt)
        return appt

    @staticmethod
    def reschedule_appointment(
        db: Session,
        appointment_id: str,
        new_slot_id: str,
        user_id: str
    ) -> Appointment:
        """Phase 12: Rescheduling engine atomically releasing old slot and booking new slot."""
        old_appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
        if not old_appt:
            raise ValueError("Appointment not found")

        # Validate & lock new slot
        new_slot = db.query(AppointmentSlot).filter(
            AppointmentSlot.id == new_slot_id,
            AppointmentSlot.is_booked == False,
            AppointmentSlot.status == "AVAILABLE"
        ).with_for_update().first()

        if not new_slot:
            raise ValueError("New requested slot is not available.")

        # Release old slot
        if old_appt.slot_id:
            old_slot = db.query(AppointmentSlot).filter(AppointmentSlot.id == old_appt.slot_id).first()
            if old_slot:
                old_slot.is_booked = False
                old_slot.status = "AVAILABLE"

        # Update appointment details
        old_appt.slot_id = new_slot.id
        old_appt.doctor_id = new_slot.doctor_id
        old_appt.scheduled_time = new_slot.start_time
        old_appt.status = "scheduled"

        new_slot.is_booked = True
        new_slot.status = "BOOKED"

        # Notification
        if old_appt.patient and old_appt.patient.user_id:
            notif = Notification(
                user_id=old_appt.patient.user_id,
                appointment_id=old_appt.id,
                notification_type="rescheduled",
                message=f"Appointment rescheduled to {new_slot.start_time.strftime('%b %d, %Y at %I:%M %p')}."
            )
            db.add(notif)

        db.commit()
        db.refresh(old_appt)
        return old_appt

    @staticmethod
    def get_alternative_recommendations(
        db: Session,
        doctor_id: str,
        preferred_time: Optional[datetime.datetime] = None
    ) -> List[Dict[str, Any]]:
        """Phase 13: Provides alternative doctors and slots if primary choice is unavailable."""
        doc = db.query(Doctor).filter(Doctor.id == doctor_id).first()
        if not doc:
            return []

        specialty = doc.specialty
        ranked = DoctorMatchingEngine.get_ranked_slots(db, required_specialty=specialty)
        # Filter out slots from the requested doctor if desired or return top alternatives
        alternatives = [s for s in ranked if s["doctor_id"] != doctor_id or s["start_time"] != (preferred_time.isoformat() if preferred_time else "")]
        return alternatives[:5]
