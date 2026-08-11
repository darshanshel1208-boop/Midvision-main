# MediVision AI — API Documentation (SIH1383)

## Base URL
`http://127.0.0.1:8000`

## Authentication
All protected endpoints require a `Authorization: Bearer <JWT_TOKEN>` header.

---

## 1. Authentication Endpoints (`/api/auth`)
- `POST /api/auth/register` — Register a new patient or doctor account.
- `POST /api/auth/login` — Login with username (email) and password to get JWT access token.
- `GET /api/auth/me` — Fetch currently logged-in user profile and role.

---

## 2. Doctor Management Endpoints (`/api/doctors`)
- `GET /api/doctors/` — Query doctors filtered by `specialty`, `hospital_id`, or `active_only`.
- `GET /api/doctors/{id}` — Fetch detailed doctor profile, specializations, and working hours.
- `POST /api/doctors/` — Create new doctor profile (Admin/Doctor).
- `PUT /api/doctors/{id}` — Update doctor details, specializations, consultation duration, and availability.
- `DELETE /api/doctors/{id}` — Deactivate a doctor profile.

---

## 3. Appointments & SIH1383 Engine (`/api/appointments`)
- `GET /api/appointments/recommendations`
  - **Query Params**: `specialty`, `urgency` (`normal`, `urgent`, `emergency`, `follow_up`), `hospital_id`, `report_id`
  - **Description**: Returns AI-scored and dynamically ranked doctor appointment slots.
- `GET /api/appointments/specialty-recommendation/{report_id}`
  - **Description**: Evaluates medical report findings and maps to recommended medical specialty with confidence score and clinical rationale.
- `POST /api/appointments/book`
  - **Body**: `{ "slot_id": "...", "urgency": "normal", "report_id": "..." }`
  - **Description**: Atomically books a slot with double-booking transaction safety and generates no-show predictions and notifications.
- `POST /api/appointments/{id}/cancel`
  - **Body**: `{ "reason": "..." }`
  - **Description**: Cancels appointment, updates status to `CANCELLED`, releases slot back to `AVAILABLE`, and triggers notification.
- `POST /api/appointments/{id}/reschedule`
  - **Body**: `{ "new_slot_id": "..." }`
  - **Description**: Atomically releases old slot and books new slot.
- `GET /api/appointments/alternatives`
  - **Query Params**: `doctor_id`
  - **Description**: Returns top alternative doctors and slots if preferred doctor is busy or unavailable.
- `GET /api/appointments/my-appointments` — Returns list of active appointments for patient/doctor with queue position and estimated wait time.
- `GET /api/appointments/doctor-schedule/{doctor_id}` — Returns generated 30-min timeslots for doctor.
- `POST /api/appointments/slots/block` — Blocks specific slot (Doctor/Admin).
- `POST /api/appointments/leave` — Submits doctor leave request and blocks all conflicting slots.
- `GET /api/appointments/dashboard-stats` — Aggregates hospital admin metrics, workload balancing, and live allocations.

---

## 4. Notifications Endpoints (`/api/notifications`)
- `GET /api/notifications/` — List in-app notifications for user (`unread_only` filter).
- `POST /api/notifications/{id}/read` — Mark notification as read.

---

## 5. Reports & OCR Endpoints (`/api/reports` & `/analyze`)
- `POST /api/reports/upload` — Upload medical image/report for AI processing.
- `POST /api/reports/ocr` — Extract prescription medications via OCR.
- `POST /analyze/blood-report` — Analyze numerical blood panel parameters.
- `POST /analyze/imaging` — Analyze Chest X-ray, MRI, CT, or ECG with Gemini AI.
- `POST /analyze/prescription` — Analyze prescription image.
- `POST /analyze/pdf-summary` — Summarize medical PDF text.
