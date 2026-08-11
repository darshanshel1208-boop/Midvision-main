from sqlalchemy.orm import Session
from app.models.core import Doctor, User, Hospital
from app.models.sih1383 import DoctorSpecialization, DoctorAvailability
from typing import List, Optional
import bcrypt
import uuid

class DoctorService:
    @staticmethod
    def get_all_doctors(
        db: Session,
        specialty: Optional[str] = None,
        hospital_id: Optional[str] = None,
        active_only: bool = True
    ) -> List[dict]:
        query = db.query(Doctor).join(User)
        if active_only:
            query = query.filter(Doctor.is_active == True)
        if hospital_id:
            query = query.filter(Doctor.hospital_id == hospital_id)
        if specialty:
            # Check primary specialty or specializations table
            query = query.filter(Doctor.specialty.ilike(f"%{specialty}%"))
            
        doctors = query.all()
        result = []
        for doc in doctors:
            specs = [s.specialization for s in doc.specializations] if doc.specializations else [doc.specialty]
            availabilities = [
                {
                    "day_of_week": a.day_of_week,
                    "start_time": a.start_time,
                    "end_time": a.end_time,
                    "slot_duration_minutes": a.slot_duration_minutes
                }
                for a in doc.availabilities
            ]
            result.append({
                "id": doc.id,
                "user_id": doc.user_id,
                "name": doc.user.full_name if doc.user else "Unknown Doctor",
                "email": doc.user.email if doc.user else "",
                "hospital_id": doc.hospital_id,
                "hospital_name": doc.hospital.name if doc.hospital else None,
                "specialty": doc.specialty,
                "specializations": specs,
                "experience_years": doc.experience_years,
                "rating": doc.rating,
                "consultation_duration_minutes": doc.consultation_duration_minutes,
                "is_active": doc.is_active,
                "is_emergency_available": doc.is_emergency_available,
                "working_hours": availabilities
            })
        return result

    @staticmethod
    def get_doctor_by_id(db: Session, doctor_id: str) -> Optional[dict]:
        doc = db.query(Doctor).filter(Doctor.id == doctor_id).first()
        if not doc:
            return None
        specs = [s.specialization for s in doc.specializations] if doc.specializations else [doc.specialty]
        availabilities = [
            {
                "day_of_week": a.day_of_week,
                "start_time": a.start_time,
                "end_time": a.end_time,
                "slot_duration_minutes": a.slot_duration_minutes
            }
            for a in doc.availabilities
        ]
        return {
            "id": doc.id,
            "user_id": doc.user_id,
            "name": doc.user.full_name if doc.user else "Unknown Doctor",
            "email": doc.user.email if doc.user else "",
            "hospital_id": doc.hospital_id,
            "hospital_name": doc.hospital.name if doc.hospital else None,
            "specialty": doc.specialty,
            "specializations": specs,
            "experience_years": doc.experience_years,
            "rating": doc.rating,
            "consultation_duration_minutes": doc.consultation_duration_minutes,
            "is_active": doc.is_active,
            "is_emergency_available": doc.is_emergency_available,
            "working_hours": availabilities
        }

    @staticmethod
    def create_doctor(db: Session, data: dict) -> dict:
        # Create User first if email provided
        hashed_pwd = bcrypt.hashpw(data.get("password", "password123").encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        user = User(
            email=data["email"],
            hashed_password=hashed_pwd,
            full_name=data["name"],
            role="doctor"
        )
        db.add(user)
        db.flush()

        doctor = Doctor(
            user_id=user.id,
            hospital_id=data.get("hospital_id"),
            specialty=data["specialty"],
            experience_years=data.get("experience_years", 0),
            rating=data.get("rating", 5.0),
            consultation_duration_minutes=data.get("consultation_duration_minutes", 30),
            is_active=data.get("is_active", True),
            is_emergency_available=data.get("is_emergency_available", False)
        )
        db.add(doctor)
        db.flush()

        # Add specializations
        specs = data.get("specializations", [data["specialty"]])
        for idx, spec in enumerate(specs):
            db.add(DoctorSpecialization(doctor_id=doctor.id, specialization=spec, is_primary=(idx == 0)))

        # Default working hours (Mon-Fri 09:00-17:00) if not provided
        working_days = data.get("working_days", [0, 1, 2, 3, 4])
        start_time = data.get("start_time", "09:00")
        end_time = data.get("end_time", "17:00")
        for day in working_days:
            db.add(DoctorAvailability(
                doctor_id=doctor.id,
                day_of_week=day,
                start_time=start_time,
                end_time=end_time,
                slot_duration_minutes=doctor.consultation_duration_minutes
            ))

        db.commit()
        db.refresh(doctor)
        return DoctorService.get_doctor_by_id(db, doctor.id)

    @staticmethod
    def update_doctor(db: Session, doctor_id: str, data: dict) -> Optional[dict]:
        doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
        if not doctor:
            return None

        if "name" in data and doctor.user:
            doctor.user.full_name = data["name"]
        if "specialty" in data:
            doctor.specialty = data["specialty"]
        if "experience_years" in data:
            doctor.experience_years = data["experience_years"]
        if "rating" in data:
            doctor.rating = data["rating"]
        if "consultation_duration_minutes" in data:
            doctor.consultation_duration_minutes = data["consultation_duration_minutes"]
        if "is_active" in data:
            doctor.is_active = data["is_active"]
        if "is_emergency_available" in data:
            doctor.is_emergency_available = data["is_emergency_available"]
        if "hospital_id" in data:
            doctor.hospital_id = data["hospital_id"]

        if "specializations" in data:
            db.query(DoctorSpecialization).filter(DoctorSpecialization.doctor_id == doctor_id).delete()
            for idx, spec in enumerate(data["specializations"]):
                db.add(DoctorSpecialization(doctor_id=doctor_id, specialization=spec, is_primary=(idx == 0)))

        db.commit()
        return DoctorService.get_doctor_by_id(db, doctor_id)

    @staticmethod
    def deactivate_doctor(db: Session, doctor_id: str) -> bool:
        doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
        if not doctor:
            return False
        doctor.is_active = False
        db.commit()
        return True
