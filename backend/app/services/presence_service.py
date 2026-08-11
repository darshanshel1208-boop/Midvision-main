import json
import datetime
from sqlalchemy.orm import Session
from app.models.core import Doctor
from app.models.presence import DoctorPresence, PresenceSensorLog, DoctorWaitlist
from app.services.ai_slot_allocator import AISlotAllocator

class PresenceService:
    @staticmethod
    def get_or_create_presence(db: Session, doctor_id: str) -> DoctorPresence:
        presence = db.query(DoctorPresence).filter(DoctorPresence.doctor_id == doctor_id).first()
        if not presence:
            # Generate default IDs for RFID, Face, and Mobile for demo/testing
            rfid = f"RFID-{doctor_id[:6].upper()}"
            face = f"FACE-{doctor_id[:6].upper()}"
            mobile = f"MOB-{doctor_id[:6].upper()}"
            
            presence = DoctorPresence(
                doctor_id=doctor_id,
                status="ABSENT",
                room_number="OPD Cabin 101",
                zone_name="OPD Block A",
                rfid_tag_id=rfid,
                face_id=face,
                mobile_device_id=mobile,
                last_detection_method="SYSTEM",
                presence_confidence=0.0,
                distance_meters=15.0,
                last_seen_at=datetime.datetime.utcnow()
            )
            db.add(presence)
            db.commit()
            db.refresh(presence)
        return presence

    @staticmethod
    def process_rfid_event(db: Session, rfid_tag_id: str, room_number: str, action: str = "ENTER", reader_id: str = "RFID-RDR-01") -> dict:
        presence = db.query(DoctorPresence).filter(DoctorPresence.rfid_tag_id == rfid_tag_id).first()
        if not presence:
            # Fallback check doctor by ID if passed as tag
            presence = db.query(DoctorPresence).filter(DoctorPresence.doctor_id == rfid_tag_id).first()
            if not presence:
                doctor = db.query(Doctor).filter(Doctor.id == rfid_tag_id).first()
                if doctor:
                    presence = PresenceService.get_or_create_presence(db, doctor.id)

        if not presence:
            return {"success": False, "message": f"No doctor associated with RFID Tag {rfid_tag_id}"}

        prev_status = presence.status
        new_status = "PRESENT" if action in ["ENTER", "SWIPE_IN"] else "ABSENT"
        
        presence.status = new_status
        presence.room_number = room_number
        presence.last_detection_method = "RFID"
        presence.presence_confidence = 0.98 if new_status == "PRESENT" else 0.0
        presence.distance_meters = 0.5 if new_status == "PRESENT" else 25.0
        presence.last_seen_at = datetime.datetime.utcnow()

        # Sensor log
        log = PresenceSensorLog(
            doctor_id=presence.doctor_id,
            sensor_type="RFID",
            device_id=reader_id,
            event_action=action,
            raw_data=json.dumps({"rfid_tag_id": rfid_tag_id, "action": action, "room": room_number}),
            confidence_score=0.98,
            detected_room=room_number,
            timestamp=datetime.datetime.utcnow()
        )
        db.add(log)
        db.commit()
        db.refresh(presence)

        # Trigger AI Waitlist allocation if transition to PRESENT
        allocation_result = None
        if new_status == "PRESENT" and prev_status != "PRESENT":
            allocation_result = AISlotAllocator.auto_allocate_waitlist(db, presence.doctor_id)

        return {
            "success": True,
            "doctor_id": presence.doctor_id,
            "status": presence.status,
            "detection_method": "RFID",
            "room_number": presence.room_number,
            "confidence": presence.presence_confidence,
            "ai_allocation": allocation_result
        }

    @staticmethod
    def process_face_detection_event(db: Session, face_id: str, confidence_score: float, room_number: str, camera_id: str = "CAM-OPD-03") -> dict:
        presence = db.query(DoctorPresence).filter(DoctorPresence.face_id == face_id).first()
        if not presence:
            presence = db.query(DoctorPresence).filter(DoctorPresence.doctor_id == face_id).first()
            if not presence:
                doctor = db.query(Doctor).filter(Doctor.id == face_id).first()
                if doctor:
                    presence = PresenceService.get_or_create_presence(db, doctor.id)

        if not presence:
            return {"success": False, "message": f"No doctor record matching Face ID {face_id}"}

        prev_status = presence.status
        is_detected = confidence_score >= 0.70
        new_status = "PRESENT" if is_detected else presence.status

        presence.status = new_status
        presence.room_number = room_number
        presence.last_detection_method = "FACE_DETECTION"
        presence.presence_confidence = float(confidence_score)
        presence.distance_meters = 1.0 if is_detected else presence.distance_meters
        presence.last_seen_at = datetime.datetime.utcnow()

        log = PresenceSensorLog(
            doctor_id=presence.doctor_id,
            sensor_type="FACE_DETECTION",
            device_id=camera_id,
            event_action="MATCH_DETECTED" if is_detected else "LOW_CONFIDENCE",
            raw_data=json.dumps({"face_id": face_id, "confidence": confidence_score, "room": room_number}),
            confidence_score=float(confidence_score),
            detected_room=room_number,
            timestamp=datetime.datetime.utcnow()
        )
        db.add(log)
        db.commit()
        db.refresh(presence)

        allocation_result = None
        if new_status == "PRESENT" and prev_status != "PRESENT":
            allocation_result = AISlotAllocator.auto_allocate_waitlist(db, presence.doctor_id)

        return {
            "success": True,
            "doctor_id": presence.doctor_id,
            "status": presence.status,
            "detection_method": "FACE_DETECTION",
            "confidence": presence.presence_confidence,
            "room_number": presence.room_number,
            "ai_allocation": allocation_result
        }

    @staticmethod
    def process_mobile_proximity_event(db: Session, mobile_device_id: str, distance_meters: float, beacon_id: str = "BLE-BEACON-102") -> dict:
        presence = db.query(DoctorPresence).filter(DoctorPresence.mobile_device_id == mobile_device_id).first()
        if not presence:
            presence = db.query(DoctorPresence).filter(DoctorPresence.doctor_id == mobile_device_id).first()
            if not presence:
                doctor = db.query(Doctor).filter(Doctor.id == mobile_device_id).first()
                if doctor:
                    presence = PresenceService.get_or_create_presence(db, doctor.id)

        if not presence:
            return {"success": False, "message": f"No doctor associated with Mobile Device ID {mobile_device_id}"}

        prev_status = presence.status
        # If doctor mobile is within 5 meters -> PRESENT; within 15 meters -> ON_PREMISES; > 15 -> ABSENT
        if distance_meters <= 5.0:
            new_status = "PRESENT"
            conf = 0.95
        elif distance_meters <= 15.0:
            new_status = "ON_BREAK"
            conf = 0.80
        else:
            new_status = "ABSENT"
            conf = 0.20

        presence.status = new_status
        presence.distance_meters = float(distance_meters)
        presence.last_detection_method = "MOBILE_PROXIMITY"
        presence.presence_confidence = conf
        presence.last_seen_at = datetime.datetime.utcnow()

        log = PresenceSensorLog(
            doctor_id=presence.doctor_id,
            sensor_type="MOBILE_PROXIMITY",
            device_id=beacon_id,
            event_action="PROXIMITY_PING",
            raw_data=json.dumps({"mobile_device_id": mobile_device_id, "distance_meters": distance_meters}),
            confidence_score=conf,
            detected_room=presence.room_number,
            timestamp=datetime.datetime.utcnow()
        )
        db.add(log)
        db.commit()
        db.refresh(presence)

        allocation_result = None
        if new_status == "PRESENT" and prev_status != "PRESENT":
            allocation_result = AISlotAllocator.auto_allocate_waitlist(db, presence.doctor_id)

        return {
            "success": True,
            "doctor_id": presence.doctor_id,
            "status": presence.status,
            "detection_method": "MOBILE_PROXIMITY",
            "distance_meters": distance_meters,
            "confidence": presence.presence_confidence,
            "ai_allocation": allocation_result
        }

    @staticmethod
    def manual_override_status(db: Session, doctor_id: str, status: str, room_number: str = None) -> dict:
        presence = PresenceService.get_or_create_presence(db, doctor_id)
        prev_status = presence.status
        presence.status = status
        if room_number:
            presence.room_number = room_number
        presence.last_detection_method = "MANUAL_OVERRIDE"
        presence.presence_confidence = 1.0
        presence.last_seen_at = datetime.datetime.utcnow()

        log = PresenceSensorLog(
            doctor_id=presence.doctor_id,
            sensor_type="MANUAL_OVERRIDE",
            device_id="DOCTOR_PORTAL",
            event_action="STATUS_OVERRIDE",
            raw_data=json.dumps({"status": status, "room": presence.room_number}),
            confidence_score=1.0,
            detected_room=presence.room_number,
            timestamp=datetime.datetime.utcnow()
        )
        db.add(log)
        db.commit()
        db.refresh(presence)

        allocation_result = None
        if status == "PRESENT" and prev_status != "PRESENT":
            allocation_result = AISlotAllocator.auto_allocate_waitlist(db, doctor_id)

        return {
            "success": True,
            "doctor_id": presence.doctor_id,
            "status": presence.status,
            "detection_method": "MANUAL_OVERRIDE",
            "ai_allocation": allocation_result
        }
