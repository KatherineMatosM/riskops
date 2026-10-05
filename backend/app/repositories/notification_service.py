from sqlalchemy.orm import Session
from app.models.notification import Notification
from app.models.risk import Risk
from app.repositories.notification_repository import NotificationRepository
from app.utils.exceptions import NotFoundError
from app.schemas.notification_schema import NotificationOut


class NotificationService:
    def __init__(self, db: Session):
        self.repo = NotificationRepository(db)

    def list_for_user(self, user_id: int) -> list[NotificationOut]:
        return [NotificationOut.model_validate(n) for n in self.repo.list_for_user(user_id)]

    def mark_as_read(self, notification_id: int) -> NotificationOut:
        notification = self.repo.get_by_id(notification_id)
        if not notification:
            raise NotFoundError("Notificacion no encontrada.", "NOTIFICATION_NOT_FOUND")
        notification = self.repo.mark_as_read(notification)
        return NotificationOut.model_validate(notification)

    def notify_risk_critical(self, risk: Risk) -> None:
        self.repo.create(Notification(
            user_id=None, title="Riesgo critico registrado",
            message=f"El riesgo '{risk.title}' fue clasificado como CRITICO.",
            type="RISK_CRITICAL",
        ))

    def notify_risk_assigned(self, risk: Risk) -> None:
        if risk.responsible_user_id:
            self.repo.create(Notification(
                user_id=risk.responsible_user_id, title="Riesgo asignado",
                message=f"Se te asigno el riesgo '{risk.title}'.",
                type="RISK_ASSIGNED",
            ))

    def notify_mitigation_due_soon(self, plan) -> None:
        self.repo.create(Notification(
            user_id=plan.responsible_user_id, title="Plan de mitigacion proximo a vencer",
            message=f"El plan '{plan.title}' vence el {plan.due_date}.",
            type="MITIGATION_DUE_SOON",
        ))

    def notify_mitigation_overdue(self, plan) -> None:
        self.repo.create(Notification(
            user_id=plan.responsible_user_id, title="Plan de mitigacion atrasado",
            message=f"El plan '{plan.title}' esta atrasado desde el {plan.due_date}.",
            type="MITIGATION_OVERDUE",
        ))