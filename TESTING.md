# MediVision AI — Testing Report (SIH1383)

## Test Execution Summary

| Test Case | Description | Result |
| :--- | :--- | :--- |
| `test_list_doctors` | Verify REST endpoint `/api/doctors/` returns active doctor profiles. | **PASSED** |
| `test_get_doctor_by_id` | Verify doctor lookup by ID returns working hours & specializations. | **PASSED** |
| `test_slot_engine_generation` | Verify dynamic slot generator calculates 30-min timeslots while respecting leaves. | **PASSED** |
| `test_appointment_ranking` | Verify AI scoring engine ranks available slots by specialty, workload, and wait time. | **PASSED** |
| `test_booking_and_cancellation` | Verify appointment booking locks slot and cancellation releases slot back to AVAILABLE. | **PASSED** |
| `test_double_booking_prevention` | Verify concurrent simultaneous booking attempts result in exactly 1 success. | **PASSED** |
| `Next.js Production Build` | Verify static compilation of all 21 frontend routes. | **PASSED** |

---

## How to Run Tests

### Backend Unit & Concurrency Tests:
```bash
cd backend
.\venv\Scripts\python.exe -m pytest tests/test_sih1383.py
```

### Frontend Build Verification:
```bash
cd frontend
npm run build
```
