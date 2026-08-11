import uuid
import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer, Boolean, Float
from sqlalchemy.orm import relationship
from app.database.database import Base

class DoctorPresence(Base):
    __tablename__ = "doctor_presence"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    doctor_id = Column(String, ForeignKey("doctors.id"), unique=True, index=True)
    
    # Presence status: ABSENT, PRESENT, IN_CONSULTATION, ON_BREAK, EMERGENCY_DISPATCH
    status = Column(String, default="ABSENT", index=True)
    
    # Room / Location details
    room_number = Column(String, nullable=True, default="OPD Room 101")
    zone_name = Column(String, nullable=True, default="OPD Block A")
    
    # Active presence detection technology & IDs
    rfid_tag_id = Column(String, nullable=True, index=True)
    face_id = Column(String, nullable=True, index=True)
    mobile_device_id = Column(String, nullable=True, index=True)
    
    # Current active signal source and confidence
    last_detection_method = Column(String, default="MANUAL_OVERRIDE") # RFID, FACE_DETECTION, MOBILE_PROXIMITY, MANUAL_OVERRIDE
    presence_confidence = Column(Float, default=0.0) # 0.0 to 1.0 score
    
    # Distance / Signal parameters
    distance_meters = Column(Float, nullable=True, default=0.0) # From mobile proximity / BLE
    
    last_seen_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    doctor = relationship("Doctor")

class PresenceSensorLog(Base):
    __tablename__ = "presence_sensor_logs"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    doctor_id = Column(String, ForeignKey("doctors.id"), index=True)
    
    sensor_type = Column(String, index=True) # RFID, FACE_DETECTION, MOBILE_PROXIMITY
    device_id = Column(String, nullable=True) # Sensor Reader ID / Camera ID / Beacon ID
    
    # Payload details
    event_action = Column(String) # ENTER, EXIT, HEARTBEAT, MATCH_DETECTED
    raw_data = Column(Text, nullable=True) # JSON payload
    confidence_score = Column(Float, default=1.0)
    detected_room = Column(String, nullable=True)
    
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    
    doctor = relationship("Doctor")

class DoctorWaitlist(Base):
    __tablename__ = "doctor_waitlist"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String, ForeignKey("patients.id"), index=True)
    doctor_id = Column(String, ForeignKey("doctors.id"), index=True)
    specialty_required = Column(String, index=True)
    
    urgency_level = Column(String, default="NORMAL", index=True) # EMERGENCY, URGENT, NORMAL, FOLLOW_UP
    symptoms = Column(Text, nullable=True)
    report_id = Column(String, ForeignKey("medical_reports.id"), nullable=True)
    
    status = Column(String, default="WAITLISTED", index=True) # WAITLISTED, ALLOCATED, CANCELLED, EXPIRED
    allocated_slot_id = Column(String, ForeignKey("appointment_slots.id"), nullable=True)
    
    priority_score = Column(Float, default=1.0) # Calculated by AI engine
    requested_at = Column(DateTime, default=datetime.datetime.utcnow)
    allocated_at = Column(DateTime, nullable=True)
    
    patient = relationship("Patient")
    doctor = relationship("Doctor")
    allocated_slot = relationship("AppointmentSlot")
