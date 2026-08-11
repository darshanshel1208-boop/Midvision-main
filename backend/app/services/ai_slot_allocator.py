import datetime
from sqlalchemy.orm import Session
from app.models.core import Doctor, Patient
from app.models.sih1383 import Appointment, AppointmentSlot, AppointmentQueue, AILog, Notification
from app.models.presence import DoctorPresence, DoctorWaitlist

class AISlotAllocator:
    @staticmethod
    def calculate_patient_priority_score(waitlist_entry: DoctorWaitlist) -> float:
        # Base Urgency weights
        urgency_weights = {
            "EMERGENCY": 100.0,
            "URGENT": 75.0,
            "NORMAL": 40.0,
            "FOLLOW_UP": 20.0
        }
        base = urgency_weights.get(waitlist_entry.urgency_level.upper(), 30.0)
        
        # Time waiting factor (+1 point for every 5 mins waited)
        now = datetime.datetime.utcnow()
        waited_seconds = (now - waitlist_entry.requested_at).total_seconds()
        waited_minutes = max(0, waited_seconds / 60.0)
        wait_bonus = min(50.0, waited_minutes * 0.2)
        
        # Medical report attachment factor
        report_bonus = 15.0 if waitlist_entry.report_id else 0.0
        
        total_score = base + wait_bonus + report_bonus
        return round(total_score, 2)

    @staticmethod
    def auto_allocate_waitlist(db: Session, doctor_id: str) -> dict:
        """
        AI engine that queries active doctor presence and assigns available slots
        to waitlisted patients in order of dynamic AI priority scoring.
        """
        presence = db.query(DoctorPresence).filter(DoctorPresence.doctor_id == doctor_id).first()
        if not presence or presence.status != "PRESENT":
            return {
                "allocated": False,
                "reason": "Doctor is currently absent or not present in OPD cabin."
            }

        # Retrieve pending waitlisted patients for this doctor or specialty
        doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
        if not doctor:
            return {"allocated": False, "reason": "Doctor not found."}

        waitlist_entries = db.query(DoctorWaitlist).filter(
            DoctorWaitlist.status == "WAITLISTED",
            (DoctorWaitlist.doctor_id == doctor_id) | (DoctorWaitlist.specialty_required == doctor.specialty)
        ).all()

        if not waitlist_entries:
            return {"allocated": False, "allocated_count": 0, "reason": "No waitlisted patients queued."}

        # Calculate priority scores and sort descending
        scored_entries = []
        for entry in waitlist_entries:
            score = AISlotAllocator.calculate_patient_priority_score(entry)
            entry.priority_score = score
            scored_entries.append((score, entry))
        
        scored_entries.sort(key=lambda x: x[0], reverse=True)

        # Find available slots for this doctor starting now or soon
        now = datetime.datetime.utcnow()
        available_slots = db.query(AppointmentSlot).filter(
            AppointmentSlot.doctor_id == doctor_id,
            AppointmentSlot.status == "AVAILABLE",
            AppointmentSlot.start_time >= now - datetime.timedelta(minutes=30)
        ).order_by(AppointmentSlot.start_time.asc()).all()

        # If no future slots exist, dynamically generate next available 30-min slot
        if not available_slots:
            slot_start = now + datetime.timedelta(minutes=5)
            slot_end = slot_start + datetime.timedelta(minutes=30)
            new_slot = AppointmentSlot(
                doctor_id=doctor_id,
                start_time=slot_start,
                end_time=slot_end,
                status="AVAILABLE"
            )
            db.add(new_slot)
            db.flush()
            available_slots = [new_slot]

        allocated_results = []
        for score, entry in scored_entries:
            if not available_slots:
                # Generate another dynamic slot if waitlist exceeds available slots
                last_slot_end = allocated_results[-1]['slot_end'] if allocated_results else now
                slot_start = last_slot_end + datetime.timedelta(minutes=5)
                slot_end = slot_start + datetime.timedelta(minutes=30)
                new_slot = AppointmentSlot(
                    doctor_id=doctor_id,
                    start_time=slot_start,
                    end_time=slot_end,
                    status="AVAILABLE"
                )
                db.add(new_slot)
                db.flush()
                slot = new_slot
            else:
                slot = available_slots.pop(0)

            # Assign slot to waitlisted patient
            slot.status = "BOOKED"
            slot.is_booked = True

            # Create Appointment record
            appointment = Appointment(
                patient_id=entry.patient_id,
                doctor_id=doctor_id,
                slot_id=slot.id,
                scheduled_time=slot.start_time,
                status="scheduled",
                urgency_level=entry.urgency_level.lower(),
                type="consultation"
            )
            db.add(appointment)
            db.flush()

            # Create Appointment Queue entry
            current_queue_len = db.query(AppointmentQueue).filter(
                AppointmentQueue.doctor_id == doctor_id,
                AppointmentQueue.status == "waiting"
            ).count()

            queue_item = AppointmentQueue(
                doctor_id=doctor_id,
                appointment_id=appointment.id,
                queue_position=current_queue_len + 1,
                estimated_start_time=slot.start_time,
                estimated_wait_minutes=(current_queue_len + 1) * doctor.consultation_duration_minutes,
                status="waiting"
            )
            db.add(queue_item)

            # Update waitlist status
            entry.status = "ALLOCATED"
            entry.allocated_slot_id = slot.id
            entry.allocated_at = datetime.datetime.utcnow()

            # Create notification
            patient = db.query(Patient).filter(Patient.id == entry.patient_id).first()
            if patient:
                notif = Notification(
                    user_id=patient.user_id,
                    appointment_id=appointment.id,
                    notification_type="appointment_booked",
                    message=f"AI Slot Allocated! Doctor presence confirmed in {presence.room_number}. Your appointment is set for {slot.start_time.strftime('%H:%M')}."
                )
                db.add(notif)

            allocated_results.append({
                "patient_id": entry.patient_id,
                "appointment_id": appointment.id,
                "slot_id": slot.id,
                "priority_score": score,
                "slot_start": slot.start_time,
                "slot_end": slot.end_time
            })

        # Log AI action
        log = AILog(
            action="ai_slot_waitlist_allocated",
            details=f"Doctor {doctor_id} presence confirmed ({presence.last_detection_method}). Allocated {len(allocated_results)} waitlist patients automatically."
        )
        db.add(log)

        db.commit()

        return {
            "allocated": True,
            "doctor_id": doctor_id,
            "allocated_count": len(allocated_results),
            "allocations": [
                {
                    "patient_id": r["patient_id"],
                    "appointment_id": r["appointment_id"],
                    "score": r["priority_score"],
                    "time": r["slot_start"].strftime("%H:%M")
                }
                for r in allocated_results
            ]
        }
