from app.models.core import (
    User, Patient, Hospital, Doctor, MedicalReport, Prediction, Prescription, Medicine
)
from app.models.sih1383 import (
    DoctorSpecialization, DoctorAvailability, DoctorLeave, AppointmentSlot, Appointment,
    AppointmentQueue, PatientPreference, Notification, AILog, AppointmentPrediction, WaitTimePrediction
)
from app.models.presence import (
    DoctorPresence, PresenceSensorLog, DoctorWaitlist
)

__all__ = [
    "User", "Patient", "Hospital", "Doctor", "MedicalReport", "Prediction", "Prescription", "Medicine",
    "DoctorSpecialization", "DoctorAvailability", "DoctorLeave", "AppointmentSlot", "Appointment",
    "AppointmentQueue", "PatientPreference", "Notification", "AILog", "AppointmentPrediction", "WaitTimePrediction",
    "DoctorPresence", "PresenceSensorLog", "DoctorWaitlist"
]
