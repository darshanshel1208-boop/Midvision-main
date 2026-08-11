import uuid
import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer, Boolean, Float
from sqlalchemy.orm import relationship
from app.database.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    role = Column(String, default="patient") # patient, doctor, admin
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # Relationships
    patient_profile = relationship("Patient", back_populates="user", uselist=False)
    doctor_profile = relationship("Doctor", back_populates="user", uselist=False)
    reports = relationship("MedicalReport", back_populates="user")
    notifications = relationship("Notification", back_populates="user")

class Patient(Base):
    __tablename__ = "patients"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), index=True)
    dob = Column(DateTime, nullable=True)
    gender = Column(String, nullable=True)
    blood_group = Column(String, nullable=True)
    medical_history = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="patient_profile")
    preferences = relationship("PatientPreference", back_populates="patient", uselist=False)
    appointments = relationship("Appointment", back_populates="patient")

class Hospital(Base):
    __tablename__ = "hospitals"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, index=True)
    address = Column(String)
    contact_email = Column(String)
    contact_phone = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    doctors = relationship("Doctor", back_populates="hospital")
    appointments = relationship("Appointment", back_populates="hospital")

class Doctor(Base):
    __tablename__ = "doctors"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), index=True)
    hospital_id = Column(String, ForeignKey("hospitals.id"), nullable=True, index=True)
    specialty = Column(String, index=True) # Cardiologist, Pulmonologist, etc.
    experience_years = Column(Integer, default=0)
    rating = Column(Float, default=5.0)
    consultation_duration_minutes = Column(Integer, default=30)
    is_active = Column(Boolean, default=True)
    is_emergency_available = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="doctor_profile")
    hospital = relationship("Hospital", back_populates="doctors")
    specializations = relationship("DoctorSpecialization", back_populates="doctor")
    availabilities = relationship("DoctorAvailability", back_populates="doctor")
    appointments = relationship("Appointment", back_populates="doctor")
    leaves = relationship("DoctorLeave", back_populates="doctor")

class MedicalReport(Base):
    __tablename__ = "medical_reports"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), index=True)
    report_type = Column(String) # blood, xray, mri, ct, ecg
    filename = Column(String)
    status = Column(String, default="analyzed")
    result_data = Column(Text) # JSON string of results
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="reports")
    prediction = relationship("Prediction", back_populates="report", uselist=False)

class Prediction(Base):
    __tablename__ = "predictions"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id = Column(String, ForeignKey("medical_reports.id"), index=True)
    ai_model = Column(String)
    confidence_score = Column(Float)
    findings = Column(Text) # JSON list
    risk_level = Column(String) # Low, Medium, High
    recommended_specialty = Column(String, nullable=True)
    
    report = relationship("MedicalReport", back_populates="prediction")

class Prescription(Base):
    __tablename__ = "prescriptions"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), index=True)
    filename = Column(String)
    status = Column(String, default="extracted")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    medicines = relationship("Medicine", back_populates="prescription")

class Medicine(Base):
    __tablename__ = "medicines"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    prescription_id = Column(String, ForeignKey("prescriptions.id"), index=True)
    name = Column(String)
    dosage = Column(String)
    schedule = Column(String) # e.g., "1-0-1", "Morning/Evening"
    duration = Column(String)
    
    prescription = relationship("Prescription", back_populates="medicines")

