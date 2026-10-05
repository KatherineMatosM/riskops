from sqlalchemy.orm import Session
from app.services.notification_service import NotificationService
from app.utils.response_helper import success_response
from app.models.user import User


def list_notifications(current_user: User, db: Session):
    return success_response(NotificationService(db).list_for_user(current_user.id))


def mark_as_read(notification_id: int, db: Session):
    return success_response(NotificationService(db).mark_as_read(notification_id))