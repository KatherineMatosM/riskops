from datetime import datetime
from sqlalchemy.orm import Session
from app.models.mitigation_action import MitigationAction
from app.repositories.mitigation_action_repository import MitigationActionRepository
from app.repositories.mitigation_plan_repository import MitigationPlanRepository
from app.utils.exceptions import NotFoundError, ValidationAppError
from app.schemas.mitigation_action_schema import MitigationActionCreateRequest, MitigationActionUpdateRequest, MitigationActionOut

VALID_STATUSES = ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]


class MitigationActionService:
    def __init__(self, db: Session):
        self.repo = MitigationActionRepository(db)
        self.plan_repo = MitigationPlanRepository(db)

    def list_by_plan(self, plan_id: int) -> list[MitigationActionOut]:
        return [MitigationActionOut.model_validate(a) for a in self.repo.list_by_plan(plan_id)]

    def create_action(self, plan_id: int, data: MitigationActionCreateRequest) -> MitigationActionOut:
        plan = self.plan_repo.get_by_id(plan_id)
        if not plan:
            raise NotFoundError("Plan de mitigacion no encontrado.", "MITIGATION_PLAN_NOT_FOUND")
        action = MitigationAction(
            mitigation_plan_id=plan_id, title=data.title, description=data.description,
            responsible_user_id=data.responsible_user_id, due_date=data.due_date, status="PENDING",
        )
        action = self.repo.create(action)
        return MitigationActionOut.model_validate(action)

    def update_action(self, action_id: int, data: MitigationActionUpdateRequest) -> MitigationActionOut:
        action = self.repo.get_by_id(action_id)
        if not action:
            raise NotFoundError("Accion de mitigacion no encontrada.", "MITIGATION_ACTION_NOT_FOUND")
        if data.status is not None and data.status not in VALID_STATUSES:
            raise ValidationAppError("Estado de accion invalido.", "INVALID_STATUS")

        if data.title is not None:
            action.title = data.title
        if data.description is not None:
            action.description = data.description
        if data.responsible_user_id is not None:
            action.responsible_user_id = data.responsible_user_id
        if data.due_date is not None:
            action.due_date = data.due_date
        if data.status is not None:
            action.status = data.status
            if data.status == "COMPLETED":
                action.completed_at = datetime.utcnow()

        action = self.repo.update(action)
        return MitigationActionOut.model_validate(action)

    def delete_action(self, action_id: int) -> None:
        action = self.repo.get_by_id(action_id)
        if not action:
            raise NotFoundError("Accion de mitigacion no encontrada.", "MITIGATION_ACTION_NOT_FOUND")
        self.repo.delete(action)