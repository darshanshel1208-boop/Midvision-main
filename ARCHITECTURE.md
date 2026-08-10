# MediVision AI — System Architecture (SIH1383)

## Architecture Overview

```
               +----------------------------------+
               |        Next.js 15 Frontend       |
               |  (Patient, Doctor, Admin Portals)|
               +----------------+-----------------+
                                | HTTP REST / JSON
                                v
               +----------------+-----------------+
               |         FastAPI Backend          |
               |       (Router / Service Layer)   |
               +-------+------------------+-------+
                       |                  |
       +---------------+--+            +--+----------------+
       |   Gemini AI &    |            |   SIH1383 Smart   |
       | Medical Analytics|            | Allocation Engine |
       +------------------+            +--+----------------+
                                          |
                                          v
                               +----------+----------+
                               |   SQLAlchemy ORM    |
                               | (SQLite / Postgres) |
                               +---------------------+
```

## System Components

1. **Frontend App Router**: Built with Next.js 15, React 19, and Tailwind CSS. Provides clean separation between Patient Portal, Doctor Portal, and Hospital Admin Dashboard.
2. **FastAPI Backend Services**:
   - `DoctorMatchingEngine` & `AppointmentScoringEngine`: Multi-criteria AI appointment ranking engine utilizing configurable weights.
   - `SlotEngine`: Dynamic slot generator producing 30-min window slots taking into account working hours, breaks, and leave days.
   - `SpecialtyRecommendationService`: Links AI medical report/imaging outputs to specialty recommendations.
   - `NotificationService`: Handles event-driven alerts.
3. **Database Engine**: Managed via SQLAlchemy ORM with model abstractions supporting SQLite and PostgreSQL engines. Atomic compare-and-swap update locks prevent double booking under high concurrent loads.
