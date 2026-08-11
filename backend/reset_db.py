import os
from sqlalchemy.orm import Session
from app.database.database import engine, Base, SessionLocal
from app.models.core import User, Patient, Doctor, Hospital, MedicalReport
from app.models.sih1383 import DoctorAvailability, AppointmentSlot, Appointment, DoctorSpecialization
from app.models.presence import DoctorPresence, DoctorWaitlist, PresenceSensorLog
import uuid
import datetime
import bcrypt

def reset_and_seed():
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    
    print("Creating all tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Seed Hospital
        hospital = Hospital(name="MediVision Central Hospital", address="123 Health Ave, NY", contact_email="contact@medivision.com")
        db.add(hospital)
        db.commit()
        
        # Seed Patient User
        pwd_hash = bcrypt.hashpw("password".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        patient_user1 = User(email="john.doe@gmail.com", hashed_password=pwd_hash, full_name="John Doe", role="patient")
        patient_user2 = User(email="alice.smith@gmail.com", hashed_password=pwd_hash, full_name="Alice Smith", role="patient")
        patient_user3 = User(email="robert.brown@gmail.com", hashed_password=pwd_hash, full_name="Robert Brown", role="patient")
        db.add_all([patient_user1, patient_user2, patient_user3])
        db.flush()

        patient1 = Patient(user_id=patient_user1.id, blood_group="A+", medical_history="Asthma history")
        patient2 = Patient(user_id=patient_user2.id, blood_group="O+", medical_history="Hypertension")
        patient3 = Patient(user_id=patient_user3.id, blood_group="B-", medical_history="Chest tightness")
        db.add_all([patient1, patient2, patient3])
        db.flush()

        # Seed Doctors
        doctors_data = [
            {"name": "Dr. Sarah Jenkins", "specialty": "Pulmonologist", "rating": 4.9, "exp": 12, "room": "OPD Cabin 101", "rfid": "RFID-SARAH-01", "face": "FACE-SARAH-01", "mob": "MOB-SARAH-01"},
            {"name": "Dr. Michael Chen", "specialty": "General Physician", "rating": 4.7, "exp": 8, "room": "OPD Cabin 102", "rfid": "RFID-MICHAEL-02", "face": "FACE-MICHAEL-02", "mob": "MOB-MICHAEL-02"},
            {"name": "Dr. Emily Watson", "specialty": "Cardiologist", "rating": 4.8, "exp": 15, "room": "OPD Cabin 201", "rfid": "RFID-EMILY-03", "face": "FACE-EMILY-03", "mob": "MOB-EMILY-03"},
            {"name": "Dr. James Wilson", "specialty": "Oncologist", "rating": 4.9, "exp": 20, "room": "OPD Cabin 202", "rfid": "RFID-JAMES-04", "face": "FACE-JAMES-04", "mob": "MOB-JAMES-04"},
            {"name": "Dr. Lisa Cuddy", "specialty": "Neurologist", "rating": 4.6, "exp": 10, "room": "OPD Cabin 301", "rfid": "RFID-LISA-05", "face": "FACE-LISA-05", "mob": "MOB-LISA-05"},
        ]
        
        doctor_objs = []
        for idx, doc_data in enumerate(doctors_data):
            hashed_pwd = bcrypt.hashpw("password".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            user = User(email=f"{doc_data['name'].lower().replace(' ', '.').replace('.', '')}@medivision.com", hashed_password=hashed_pwd, full_name=doc_data['name'], role="doctor")
            db.add(user)
            db.flush()
            
            doctor = Doctor(user_id=user.id, hospital_id=hospital.id, specialty=doc_data['specialty'], experience_years=doc_data['exp'], rating=doc_data['rating'])
            db.add(doctor)
            db.flush()
            doctor_objs.append(doctor)
            
            # Primary specialization record
            spec_rec = DoctorSpecialization(doctor_id=doctor.id, specialization=doc_data['specialty'], is_primary=True)
            db.add(spec_rec)

            # Doctor Presence Initialization
            # Give Dr. Sarah & Dr. Michael initial PRESENT status, others ABSENT for demonstration
            init_status = "PRESENT" if idx < 2 else "ABSENT"
            presence = DoctorPresence(
                doctor_id=doctor.id,
                status=init_status,
                room_number=doc_data["room"],
                zone_name="OPD Wing A",
                rfid_tag_id=doc_data["rfid"],
                face_id=doc_data["face"],
                mobile_device_id=doc_data["mob"],
                last_detection_method="RFID" if init_status == "PRESENT" else "MANUAL_OVERRIDE",
                presence_confidence=0.98 if init_status == "PRESENT" else 0.0,
                distance_meters=0.8 if init_status == "PRESENT" else 20.0,
                last_seen_at=datetime.datetime.utcnow()
            )
            db.add(presence)
            
            # Create Availability (Mon-Fri)
            for day in range(0, 5):
                avail = DoctorAvailability(doctor_id=doctor.id, day_of_week=day, start_time="09:00", end_time="17:00")
                db.add(avail)
                
            # Generate Mock Slots for today and tomorrow
            today = datetime.datetime.now().replace(hour=9, minute=0, second=0, microsecond=0)
            for day_offset in range(2):
                current_day = today + datetime.timedelta(days=day_offset)
                if current_day.weekday() < 5: # Mon-Fri
                    for hour_offset in range(8): # 9 AM to 5 PM
                        slot_start = current_day + datetime.timedelta(hours=hour_offset)
                        slot_end = slot_start + datetime.timedelta(minutes=30)
                        slot = AppointmentSlot(doctor_id=doctor.id, start_time=slot_start, end_time=slot_end, status="AVAILABLE")
                        db.add(slot)

        # Seed sample waitlisted patients
        wait1 = DoctorWaitlist(
            patient_id=patient1.id,
            doctor_id=doctor_objs[0].id, # Dr. Sarah Jenkins
            specialty_required="Pulmonologist",
            urgency_level="URGENT",
            symptoms="Persistent shortness of breath and cough",
            status="WAITLISTED",
            priority_score=78.5,
            requested_at=datetime.datetime.utcnow() - datetime.timedelta(minutes=25)
        )
        wait2 = DoctorWaitlist(
            patient_id=patient2.id,
            doctor_id=doctor_objs[2].id, # Dr. Emily Watson (Cardiologist)
            specialty_required="Cardiologist",
            urgency_level="EMERGENCY",
            symptoms="Acute palpitations and elevated heart rate",
            status="WAITLISTED",
            priority_score=105.0,
            requested_at=datetime.datetime.utcnow() - datetime.timedelta(minutes=10)
        )
        wait3 = DoctorWaitlist(
            patient_id=patient3.id,
            doctor_id=doctor_objs[1].id, # Dr. Michael Chen
            specialty_required="General Physician",
            urgency_level="NORMAL",
            symptoms="Routine seasonal follow-up",
            status="WAITLISTED",
            priority_score=42.0,
            requested_at=datetime.datetime.utcnow() - datetime.timedelta(minutes=45)
        )
        db.add_all([wait1, wait2, wait3])

        db.commit()
        print("Database seeded successfully with Hospitals, Doctors, Multi-Sensor Presences, Patients, and AI Waitlist!")
        
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    reset_and_seed()
