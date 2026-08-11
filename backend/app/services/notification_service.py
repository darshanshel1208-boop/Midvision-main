from sqlalchemy.orm import Session
from app.models import Notification
from typing import List, Optional
import datetime

class NotificationService:
    @staticmethod
    def create_notification(
        db: Session,
        user_id: str,
        message: str,
        notification_type: str = "general",
        appointment_id: Optional[str] = None
    ) -> Notification:
        notif = Notification(
            user_id=user_id,
            appointment_id=appointment_id,
            notification_type=notification_type,
            message=message,
            is_read=False
        )
        db.add(notif)
        db.commit()
        db.refresh(notif)
        return notif

    @staticmethod
    def get_user_notifications(db: Session, user_id: str, unread_only: bool = False) -> List[dict]:
        query = db.query(Notification).filter(Notification.user_id == user_id)
        if unread_only:
            query = query.filter(Notification.is_read == False)
        notifs = query.order_by(Notification.created_at.desc()).all()
        return [
            {
                "id": n.id,
                "user_id": n.user_id,
                "appointment_id": n.appointment_id,
                "notification_type": n.notification_type,
                "message": n.message,
                "is_read": n.is_read,
                "created_at": n.created_at.isoformat()
            }
            for n in notifs
        ]

    @staticmethod
    def mark_as_read(db: Session, notification_id: str, user_id: str) -> bool:
        notif = db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.user_id == user_id
        ).first()
        if not notif:
            return False
        notif.is_read = True
        db.commit()
        return True
