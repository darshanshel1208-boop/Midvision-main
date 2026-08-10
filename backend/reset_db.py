import os
from sqlalchemy.orm import Session
from app.database.database import engine, Base, SessionLocal
from app.models.core import User, Patient, Doctor, Hospital, MedicalReport
from app.models.sih1383 import DoctorAvailability, AppointmentSlot, Appointment, DoctorSpecialization
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
        
        # Seed Doctors
        doctors_data = [
            {"name": "Dr. Sarah Jenkins", "specialty": "Pulmonologist", "rating": 4.9, "exp": 12},
            {"name": "Dr. Michael Chen", "specialty": "General Physician", "rating": 4.7, "exp": 8},
            {"name": "Dr. Emily Watson", "specialty": "Cardiologist", "rating": 4.8, "exp": 15},
            {"name": "Dr. James Wilson", "specialty": "Oncologist", "rating": 4.9, "exp": 20},
            {"name": "Dr. Lisa Cuddy", "specialty": "Neurologist", "rating": 4.6, "exp": 10},
        ]
        
        for doc_data in doctors_data:
            hashed_pwd = bcrypt.hashpw("password".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            user = User(email=f"{doc_data['name'].lower().replace(' ', '.').replace('.', '')}@medivision.com", hashed_password=hashed_pwd, full_name=doc_data['name'], role="doctor")
            db.add(user)
            db.flush() # get user.id
            
            doctor = Doctor(user_id=user.id, hospital_id=hospital.id, specialty=doc_data['specialty'], experience_years=doc_data['exp'], rating=doc_data['rating'])
            db.add(doctor)
            db.flush()
            
            # Primary specialization record
            spec_rec = DoctorSpecialization(doctor_id=doctor.id, specialization=doc_data['specialty'], is_primary=True)
            db.add(spec_rec)
            
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

        db.commit()
        print("Database seeded successfully with Hospitals, Doctors, Specializations, and Appointment Slots!")
        
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    reset_and_seed()

