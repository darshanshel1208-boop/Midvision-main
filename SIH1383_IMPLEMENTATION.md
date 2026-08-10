# SIH1383 — Problem Statement & Solution Report

## Problem Statement Summary
**SIH1383**: "Optimizing Doctor Availability and Appointment Allocation using Digital Technology & AI"

Healthcare institutions face critical challenges in doctor availability management, long wait times, emergency schedule disruptions, and improper specialty allocation.

---

## MediVision AI Solution & Pipeline

```
Patient
  │
  ▼
Medical Report / Image Analysis (Gemini AI & Parameter Engine)
  │
  ▼
AI Clinical Screening & Specialty Recommendation
  │
  ▼
Doctor Matching Engine (Specialty, Location, Hospital, Workload)
  │
  ▼
Dynamic Availability Engine (Working hours, Breaks, Leaves, Emergency)
  │
  ▼
AI Slot Ranking Engine (Configurable multi-criteria scoring)
  │
  ▼
Atomic Appointment Allocation (Concurrency safe DB transaction)
  │
  ▼
Notification & Wait-Time Estimation Dispatch
```

---

## Implemented SIH1383 Features & Verification
1. **Dynamic Doctor Availability Engine**: Calculates 30-min window slots accounting for working days/hours, breaks, and leave requests (`DoctorLeave`).
2. **AI-Assisted Specialty Recommendation**: Maps medical report findings (X-ray, ECG, MRI, CT, Blood panel) to specialties with confidence score and rationale.
3. **Multi-Criteria Doctor Matching & Scoring**: Configurable weights for Specialty Match (40%), Availability (20%), Urgency (15%), Patient Preference (10%), Workload Balance (10%), Wait-time efficiency (5%).
4. **Priority System**: Tiers (`EMERGENCY`, `URGENT`, `NORMAL`, `FOLLOW_UP`) dynamically adjusting slot scores and queue priority.
5. **Atomic Double-Booking Prevention**: SqlAlchemy atomic compare-and-swap SQL queries ensuring only 1 booking succeeds under simultaneous access.
6. **Cancellation & Rescheduling**: Full lifecycle slot release and atomic slot swap.
7. **No-Show Prediction & Notifications**: Baseline predictions stored and in-app notifications dispatched.
8. **Patient, Doctor, and Admin Portals**: Dedicated controls for scheduling, slot blocking, leave management, and hospital queue metrics.
