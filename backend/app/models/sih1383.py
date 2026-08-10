import uuid
import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer, Boolean, Float, Index
from sqlalchemy.orm import relationship
from app.database.database import Base

class DoctorSpecialization(Base):
    __tablename__ = "doctor_specializations"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    doctor_id = Column(String, ForeignKey("doctors.id"), index=True)
    specialization = Column(String, index=True)
    is_primary = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    doctor = relationship("Doctor", back_populates="specializations")

class DoctorAvailability(Base):
    __tablename__ = "doctor_availability"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    doctor_id = Column(String, ForeignKey("doctors.id"), index=True)
    day_of_week = Column(Integer) # 0=Monday, 6=Sunday
    start_time = Column(String) # "09:00"
    end_time = Column(String) # "17:00"
    slot_duration_minutes = Column(Integer, default=30)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    doctor = relationship("Doctor", back_populates="availabilities")

class DoctorLeave(Base):
    __tablename__ = "doctor_leave"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    doctor_id = Column(String, ForeignKey("doctors.id"), index=True)
    start_date = Column(DateTime, index=True)
    end_date = Column(DateTime, index=True)
    reason = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    doctor = relationship("Doctor", back_populates="leaves")

class AppointmentSlot(Base):
    """Actual generated slots based on availability, used for the booking engine"""
    __tablename__ = "appointment_slots"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    doctor_id = Column(String, ForeignKey("doctors.id"), index=True)
    start_time = Column(DateTime, index=True)
    end_time = Column(DateTime, index=True)
    is_booked = Column(Boolean, default=False, index=True)
    status = Column(String, default="AVAILABLE", index=True) # AVAILABLE, HELD, BOOKED, BLOCKED, CANCELLED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    doctor = relationship("Doctor")
    appointment = relationship("Appointment", back_populates="slot", uselist=False)

class Appointment(Base):
    __tablename__ = "appointments"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String, ForeignKey("patients.id"), index=True)
    doctor_id = Column(String, ForeignKey("doctors.id"), index=True)
    hospital_id = Column(String, ForeignKey("hospitals.id"), nullable=True, index=True)
    slot_id = Column(String, ForeignKey("appointment_slots.id"), nullable=True, index=True)
    report_id = Column(String, ForeignKey("medical_reports.id"), nullable=True, index=True) # If tied to an AI analysis
    
    scheduled_time = Column(DateTime, index=True)
    status = Column(String, default="scheduled", index=True) # scheduled, completed, cancelled, no_show, in_consultation
    urgency_level = Column(String, default="normal", index=True) # normal, urgent, emergency, follow_up
    type = Column(String, default="consultation") # consultation, follow-up
    
    cancelled_at = Column(DateTime, nullable=True)
    cancelled_by = Column(String, nullable=True)
    cancellation_reason = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    doctor = relationship("Doctor", back_populates="appointments")
    patient = relationship("Patient", back_populates="appointments")
    hospital = relationship("Hospital", back_populates="appointments")
    slot = relationship("AppointmentSlot", back_populates="appointment")
    prediction = relationship("AppointmentPrediction", back_populates="appointment", uselist=False)
    notifications = relationship("Notification", back_populates="appointment")
    queue_entry = relationship("AppointmentQueue", back_populates="appointment", uselist=False)

class AppointmentQueue(Base):
    __tablename__ = "appointment_queue"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    doctor_id = Column(String, ForeignKey("doctors.id"), index=True)
    appointment_id = Column(String, ForeignKey("appointments.id"), index=True)
    queue_position = Column(Integer, default=1)
    estimated_start_time = Column(DateTime, nullable=True)
    estimated_wait_minutes = Column(Integer, default=0)
    status = Column(String, default="waiting", index=True) # waiting, in_consultation, completed, skipped
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    doctor = relationship("Doctor")
    appointment = relationship("Appointment", back_populates="queue_entry")

class PatientPreference(Base):
    __tablename__ = "patient_preferences"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String, ForeignKey("patients.id"), index=True)
    preferred_time_of_day = Column(String, nullable=True) # morning, afternoon, evening
    preferred_doctor_id = Column(String, ForeignKey("doctors.id"), nullable=True)
    preferred_hospital_id = Column(String, ForeignKey("hospitals.id"), nullable=True)
    preferred_language = Column(String, default="English")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    patient = relationship("Patient", back_populates="preferences")

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), index=True)
    appointment_id = Column(String, ForeignKey("appointments.id"), nullable=True, index=True)
    notification_type = Column(String, default="general") # appointment_booked, reminder, cancellation, rescheduling, doctor_unavailable
    message = Column(Text)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="notifications")
    appointment = relationship("Appointment", back_populates="notifications")

class AILog(Base):
    """Logging all AI actions for audit"""
    __tablename__ = "ai_logs"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    action = Column(String, index=True) # "appointment_ranked", "report_analyzed"
    details = Column(Text) # JSON string of inputs/outputs
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class AppointmentPrediction(Base):
    """Machine learning predictions for appointments (e.g. no-show prob)"""
    __tablename__ = "appointment_predictions"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    appointment_id = Column(String, ForeignKey("appointments.id"), index=True)
    no_show_probability = Column(Float, default=0.0)
    predicted_wait_time_mins = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    appointment = relationship("Appointment", back_populates="prediction")

class WaitTimePrediction(Base):
    """Wait time estimation logs & model evaluations"""
    __tablename__ = "wait_time_predictions"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    appointment_id = Column(String, ForeignKey("appointments.id"), index=True)
    doctor_id = Column(String, ForeignKey("doctors.id"), index=True)
    predicted_wait_time_mins = Column(Float, default=0.0)
    actual_wait_time_mins = Column(Float, nullable=True)
    factors_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

