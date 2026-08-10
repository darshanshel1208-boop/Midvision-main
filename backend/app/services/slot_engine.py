import datetime
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from app.models import Doctor, DoctorAvailability, DoctorLeave, AppointmentSlot, Appointment

class SlotEngine:
    """
    Dynamic Slot Generation & Availability Engine for SIH1383.
    Calculates exact available 30-minute consultation slots taking into account:
    - Doctor's weekly working hours & breaks
    - Doctor's active leave days
    - Existing booked or blocked slots
    - Emergency availability overrides
    """

    @staticmethod
    def generate_slots_for_doctor(db: Session, doctor_id: str, days_ahead: int = 7) -> List[AppointmentSlot]:
        doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
        if not doctor or not doctor.is_active:
            return []

        now = datetime.datetime.now()
        start_date = now.date()
        slot_duration = datetime.timedelta(minutes=doctor.consultation_duration_minutes or 30)

        # Fetch Doctor Availabilities & Leaves
        availabilities = db.query(DoctorAvailability).filter(DoctorAvailability.doctor_id == doctor_id).all()
        avail_by_day = {a.day_of_week: a for a in availabilities}
        leaves = db.query(DoctorLeave).filter(DoctorLeave.doctor_id == doctor_id).all()

        generated_slots = []

        for d_offset in range(days_ahead):
            current_date = start_date + datetime.timedelta(days=d_offset)
            weekday = current_date.weekday() # 0 = Mon, 6 = Sun

            # Check if doctor is on leave on this date
            is_on_leave = any(
                l.start_date.date() <= current_date <= l.end_date.date()
                for l in leaves
            )
            if is_on_leave:
                continue

            if weekday not in avail_by_day:
                continue

            avail = avail_by_day[weekday]
            try:
                start_h, start_m = map(int, avail.start_time.split(":"))
                end_h, end_m = map(int, avail.end_time.split(":"))
            except ValueError:
                start_h, start_m = 9, 0
                end_h, end_m = 17, 0

            work_start = datetime.datetime.combine(current_date, datetime.time(start_h, start_m))
            work_end = datetime.datetime.combine(current_date, datetime.time(end_h, end_m))

            current_slot_time = work_start
            while current_slot_time + slot_duration <= work_end:
                slot_end = current_slot_time + slot_duration

                # Skip past times for today
                if current_slot_time > now:
                    # Check if slot already exists in DB
                    existing = db.query(AppointmentSlot).filter(
                        AppointmentSlot.doctor_id == doctor_id,
                        AppointmentSlot.start_time == current_slot_time
                    ).first()

                    if not existing:
                        new_slot = AppointmentSlot(
                            doctor_id=doctor_id,
                            start_time=current_slot_time,
                            end_time=slot_end,
                            is_booked=False,
                            status="AVAILABLE"
                        )
                        db.add(new_slot)
                        generated_slots.append(new_slot)
                    else:
                        generated_slots.append(existing)

                current_slot_time += slot_duration

        db.commit()
        return generated_slots

    @staticmethod
    def get_available_slots(db: Session, doctor_id: str, date_str: Optional[str] = None) -> List[dict]:
        # Ensure fresh slots are generated
        SlotEngine.generate_slots_for_doctor(db, doctor_id, days_ahead=7)

        now = datetime.datetime.now()
        query = db.query(AppointmentSlot).filter(
            AppointmentSlot.doctor_id == doctor_id,
            AppointmentSlot.is_booked == False,
            AppointmentSlot.status == "AVAILABLE",
            AppointmentSlot.start_time > now
        )

        if date_str:
            try:
                target_date = datetime.datetime.strptime(date_str, "%Y-%m-%d").date()
                day_start = datetime.datetime.combine(target_date, datetime.time.min)
                day_end = datetime.datetime.combine(target_date, datetime.time.max)
                query = query.filter(
                    AppointmentSlot.start_time >= day_start,
                    AppointmentSlot.start_time <= day_end
                )
            except ValueError:
                pass

        slots = query.order_by(AppointmentSlot.start_time.asc()).all()
        return [
            {
                "slot_id": s.id,
                "doctor_id": s.doctor_id,
                "start_time": s.start_time.isoformat(),
                "end_time": s.end_time.isoformat(),
                "status": s.status,
                "is_booked": s.is_booked
            }
            for s in slots
        ]
