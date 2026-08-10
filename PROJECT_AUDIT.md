# MediVision AI — Project Audit (Phase 0)

## Executive Summary
MediVision AI is an AI-powered Clinical Decision Support System built with Next.js, FastAPI, SQLAlchemy, SQLite/PostgreSQL, and Google Gemini AI services. This audit documents the current state of the codebase and outlines the incremental expansion path for **SIH1383: Optimizing Doctor Availability and Appointment Allocation using Digital Technology & AI**.

---

## 1. Existing Frontend Architecture
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (`.tsx`, `.ts`)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React (`lucide-react`)
- **API Integration Layer**: Centralized API client helper at `src/lib/api.ts` utilizing `fetch` with Bearer JWT token headers stored in `localStorage`.
- **Layout Structure**:
  - Root Layout: `src/app/layout.tsx` with global styles (`globals.css`, `landing.css`)
  - Dashboard Layout: `src/app/dashboard/layout.tsx` providing sidebar navigation and header bar.

## 2. Existing Backend Architecture
- **Framework**: Python 3.14 + FastAPI + Uvicorn
- **Architecture Pattern**: Router-Service-Model architecture
  - `app/main.py`: Entrypoint initializing CORS, registering routes, and checking DB tables.
  - `app/routes/`: Router modules (`auth.py`, `reports.py`, `appointments.py`, `analysis.py`).
  - `app/services/`: Business logic services (`auth_service.py`, `appointment_service.py`, `blood_report_service.py`, `gemini_service.py`).
  - `app/models/`: SQLAlchemy ORM definitions (`core.py`, `sih1383.py`, `model_loader.py`).
  - `app/database/`: Engine, SessionLocal, declarative Base (`database.py`).

## 3. Existing Database Architecture
- **ORM**: SQLAlchemy
- **Engine**: SQLite by default (`backend/medivision.db` and `backend/app/medivision.db`), configurable via `SQLALCHEMY_DATABASE_URL` to PostgreSQL.
- **Seeding Script**: `backend/reset_db.py` populates sample Hospitals, Doctors, Availabilities, and Appointment Slots.

## 4. Existing Authentication & Authorization
- **Method**: JWT Token Auth (OAuth2 password flow / Bearer tokens)
- **Security**: Password hashing via `bcrypt`, token signing via `pyjwt` or `jose`.
- **Roles**: Patient (`patient`), Doctor (`doctor`), Admin (`admin`).

## 5. Existing AI Modules
- **`gemini_service.py`**: Integrates Google Gemini 1.5 Flash / Pro API for medical image analysis (Chest X-ray, MRI, CT, ECG), prescription OCR, and PDF document summarization.
- **`blood_report_service.py`**: Reference range evaluation for blood parameters (CBC, LFT, KFT, HbA1c, Thyroid) with risk scoring and specialist recommendation.
- **`model_loader.py`**: Pre-trained model registry placeholder.

## 6. Existing APIs
- **Auth**:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `GET /api/auth/me`
- **Reports & OCR**:
  - `POST /api/reports/upload`
  - `GET /api/reports/`
  - `POST /api/reports/ocr`
- **AI Analysis**:
  - `GET /health`
  - `POST /verify-key`
  - `POST /analyze/blood-report`
  - `POST /analyze/imaging`
  - `POST /analyze/prescription`
  - `POST /analyze/pdf-summary`
- **Appointments**:
  - `GET /api/appointments/recommendations`
  - `POST /api/appointments/book`
  - `GET /api/appointments/dashboard-stats`
- **Chatbot**:
  - `POST /api/chatbot/message`

## 7. Existing Pages & Components
- **Pages (`src/app`)**:
  - Landing Page (`/`)
  - Login (`/login`)
  - Register (`/register`)
  - Dashboard Base (`/dashboard`)
  - Patient Portal (`/dashboard/patient`)
  - Doctor Portal (`/dashboard/doctor`)
  - Admin Portal (`/dashboard/admin`)
  - Appointments (`/dashboard/appointments`)
  - Analysis (`/dashboard/analysis`)
  - Upload Report (`/dashboard/upload`)
  - Symptom Checker (`/dashboard/symptoms`)
  - Health Trends (`/dashboard/trends`)
  - AI Assistant (`/dashboard/chatbot`)

## 8. Existing Models
- **Core (`app/models/core.py`)**:
  - `User`: User accounts, passwords, roles.
  - `Patient`: Patient profile linked to User.
  - `Hospital`: Hospital entity details.
  - `Doctor`: Doctor profile linked to User and Hospital.
  - `MedicalReport`: Stored user reports and raw results.
  - `Prediction`: AI predictions, risk level, recommended specialty.
  - `Prescription`: OCR prescription parent record.
  - `Medicine`: Extracted medications linked to Prescription.
- **SIH1383 (`app/models/sih1383.py`)**:
  - `DoctorAvailability`: Weekly working hours.
  - `DoctorLeave`: Planned leaves/unavailabilities.
  - `Appointment`: Scheduled/completed/cancelled bookings.
  - `AppointmentSlot`: Available timeslots.
  - `PatientPreference`: Time of day and language preferences.
  - `Notification`: User notifications log.
  - `AILog`: System AI action logs.
  - `AppointmentPrediction`: No-show and wait-time ML metrics.

## 9. Existing Appointment Functionality
- Base recommendation engine (`AppointmentEngine.get_ranked_slots`) ranking slots by doctor rating, workload, and slot timing.
- Basic appointment booking with slot status update (`is_booked = True`).
- Admin dashboard aggregation endpoint (`get_dashboard_stats`).

## 10. Missing SIH1383 Functionality & Gaps
1. **Dynamic Slot Generation**: Current slots are statically seeded in `reset_db.py`. Missing engine to generate 30-min slots dynamically taking into account breaks, leaves, and booked appointments.
2. **Doctor CRUD & Multi-Specialization**: Missing full doctor management endpoints (create, edit, deactivate, multi-specialty mapping).
3. **End-to-End Specialty Recommendation**: Seamless linking from medical report/imaging AI prediction to appointment slot search.
4. **Configurable AI Scoring Engine**: Hard-coded heuristics in `appointment_service.py` need refactoring into configurable weight matrices (specialty match, availability, urgency, workload balance, wait time, preferences).
5. **Urgency & Priority System**: Dedicated priority escalation (EMERGENCY, URGENT, NORMAL, FOLLOW_UP) with explicit queue positioning.
6. **Wait Time Estimation**: Dynamic wait time estimation based on queue position, doctor average consultation time, and delays.
7. **Cancellation & Rescheduling**: Full workflow with slot release, status history, and notifications.
8. **Alternative Doctor/Slot Finder**: Automated recommendation of alternative slots/doctors when requested slot is booked or doctor unavailable.
9. **Patient Preferences API**: Preference management endpoints and integration into ranking score.
10. **No-Show Prediction Baseline**: Feature logging and risk scoring for no-show probability.
11. **Notification System Service**: Abstracted notification service supporting in-app alerts and external channels.
12. **Doctor & Admin Interactive Controls**: Slot blocking, leave requests, consultation start/complete state toggles on Doctor dashboard.
13. **Concurrency & Race Condition Handling**: DB level locking/transaction safety to prevent double booking.
14. **Alembic Database Migrations**: Database migration scripts for schema upgrades.

## 11. Implementation Action Plan (Files to Modify & Create)

### Files to Modify:
- `backend/app/models/core.py` & `backend/app/models/sih1383.py` (Add missing fields/indexes/relationships)
- `backend/app/routes/appointments.py` (Expand endpoints for slots, cancellations, rescheduling, preferences, doctor actions)
- `backend/app/routes/reports.py` (Link report analysis to specialty matching flow)
- `backend/app/services/appointment_service.py` (Implement dynamic slot engine, scoring system, wait-time estimator, alternative slot engine)
- `frontend/src/lib/api.ts` (Add API client functions for all new endpoints)
- `frontend/src/app/dashboard/appointments/page.tsx` (Enhanced appointment booking UX with urgency, preferences, alternative recommendations)
- `frontend/src/app/dashboard/doctor/page.tsx` (Interactive doctor controls)
- `frontend/src/app/dashboard/admin/page.tsx` (Enhanced hospital admin queue management)

### Files to Create:
- `backend/app/services/doctor_service.py` (Doctor management and schedule availability)
- `backend/app/services/notification_service.py` (Notification generator and dispatcher)
- `backend/app/services/prediction_service.py` (No-show probability & wait time baseline models)
- `backend/app/routes/doctors.py` (Doctor management endpoints)
- `backend/app/routes/notifications.py` (Notification endpoints)
- `backend/tests/test_sih1383.py` (Comprehensive unit & concurrency tests)
- `PROJECT_AUDIT.md` (Project Audit Document)
- `API_DOCUMENTATION.md` (REST API documentation)
- `DATABASE_SCHEMA.md` (Database schema & entity relationships)
- `ARCHITECTURE.md` (System Architecture)
- `SIH1383_IMPLEMENTATION.md` (SIH1383 summary report)
- `TESTING.md` (Test execution report)
