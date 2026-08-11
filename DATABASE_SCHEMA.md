# MediVision AI — Database Schema Documentation (SIH1383)

## Entity Relationship Overview

```
User (1) <---> (1) Patient
User (1) <---> (1) Doctor
Hospital (1) <---> (N) Doctor
Doctor (1) <---> (N) DoctorSpecialization
Doctor (1) <---> (N) DoctorAvailability
Doctor (1) <---> (N) DoctorLeave
Doctor (1) <---> (N) AppointmentSlot
Patient (1) <---> (N) Appointment
Doctor (1) <---> (N) Appointment
Hospital (1) <---> (N) Appointment
AppointmentSlot (1) <---> (1) Appointment
Appointment (1) <---> (1) AppointmentPrediction
Appointment (1) <---> (1) AppointmentQueue
Appointment (1) <---> (N) Notification
MedicalReport (1) <---> (1) Prediction
```

---

## Table Definitions

### `users`
- `id` (String UUID, PK)
- `email` (String, Unique, Index)
- `hashed_password` (String)
- `full_name` (String)
- `role` (String: `patient`, `doctor`, `admin`)
- `created_at`, `updated_at` (DateTime)

### `patients`
- `id` (String UUID, PK)
- `user_id` (String UUID, FK `users.id`, Index)
- `dob` (DateTime)
- `gender` (String)
- `blood_group` (String)
- `medical_history` (Text)
- `created_at`, `updated_at` (DateTime)

### `hospitals`
- `id` (String UUID, PK)
- `name` (String, Index)
- `address`, `contact_email`, `contact_phone` (String)
- `created_at`, `updated_at` (DateTime)

### `doctors`
- `id` (String UUID, PK)
- `user_id` (String UUID, FK `users.id`, Index)
- `hospital_id` (String UUID, FK `hospitals.id`, Index)
- `specialty` (String, Index)
- `experience_years` (Integer)
- `rating` (Float)
- `consultation_duration_minutes` (Integer, default 30)
- `is_active` (Boolean, default True)
- `is_emergency_available` (Boolean, default False)
- `created_at`, `updated_at` (DateTime)

### `doctor_specializations`
- `id` (String UUID, PK)
- `doctor_id` (String UUID, FK `doctors.id`, Index)
- `specialization` (String, Index)
- `is_primary` (Boolean, default True)
- `created_at`, `updated_at` (DateTime)

### `doctor_availability`
- `id` (String UUID, PK)
- `doctor_id` (String UUID, FK `doctors.id`, Index)
- `day_of_week` (Integer: 0=Mon, 6=Sun)
- `start_time` (String "09:00")
- `end_time` (String "17:00")
- `slot_duration_minutes` (Integer)
- `created_at`, `updated_at` (DateTime)

### `doctor_leave`
- `id` (String UUID, PK)
- `doctor_id` (String UUID, FK `doctors.id`, Index)
- `start_date` (DateTime, Index)
- `end_date` (DateTime, Index)
- `reason` (String)
- `created_at`, `updated_at` (DateTime)

### `appointment_slots`
- `id` (String UUID, PK)
- `doctor_id` (String UUID, FK `doctors.id`, Index)
- `start_time` (DateTime, Index)
- `end_time` (DateTime, Index)
- `is_booked` (Boolean, default False, Index)
- `status` (String: `AVAILABLE`, `HELD`, `BOOKED`, `BLOCKED`, `CANCELLED`, Index)
- `created_at`, `updated_at` (DateTime)

### `appointments`
- `id` (String UUID, PK)
- `patient_id` (String UUID, FK `patients.id`, Index)
- `doctor_id` (String UUID, FK `doctors.id`, Index)
- `hospital_id` (String UUID, FK `hospitals.id`, Index)
- `slot_id` (String UUID, FK `appointment_slots.id`, Index)
- `report_id` (String UUID, FK `medical_reports.id`, Index)
- `scheduled_time` (DateTime, Index)
- `status` (String: `scheduled`, `completed`, `cancelled`, `no_show`, `in_consultation`, Index)
- `urgency_level` (String: `normal`, `urgent`, `emergency`, `follow_up`, Index)
- `type` (String)
- `cancelled_at` (DateTime), `cancelled_by` (String), `cancellation_reason` (Text)
- `created_at`, `updated_at` (DateTime)

### `appointment_queue`
- `id` (String UUID, PK)
- `doctor_id` (String UUID, FK `doctors.id`, Index)
- `appointment_id` (String UUID, FK `appointments.id`, Index)
- `queue_position` (Integer)
- `estimated_start_time` (DateTime)
- `estimated_wait_minutes` (Integer)
- `status` (String: `waiting`, `in_consultation`, `completed`, `skipped`, Index)
- `created_at`, `updated_at` (DateTime)

### `patient_preferences`
- `id` (String UUID, PK)
- `patient_id` (String UUID, FK `patients.id`, Index)
- `preferred_time_of_day` (String: `morning`, `afternoon`, `evening`)
- `preferred_doctor_id` (String UUID, FK `doctors.id`)
- `preferred_hospital_id` (String UUID, FK `hospitals.id`)
- `preferred_language` (String, default "English")
- `created_at`, `updated_at` (DateTime)

### `notifications`
- `id` (String UUID, PK)
- `user_id` (String UUID, FK `users.id`, Index)
- `appointment_id` (String UUID, FK `appointments.id`, Index)
- `notification_type` (String)
- `message` (Text)
- `is_read` (Boolean, default False)
- `created_at`, `updated_at` (DateTime)

### `appointment_predictions`
- `id` (String UUID, PK)
- `appointment_id` (String UUID, FK `appointments.id`, Index)
- `no_show_probability` (Float)
- `predicted_wait_time_mins` (Integer)
- `created_at`, `updated_at` (DateTime)

### `wait_time_predictions`
- `id` (String UUID, PK)
- `appointment_id` (String UUID, FK `appointments.id`, Index)
- `doctor_id` (String UUID, FK `doctors.id`, Index)
- `predicted_wait_time_mins` (Float)
- `actual_wait_time_mins` (Float)
- `factors_json` (Text)
- `created_at` (DateTime)
