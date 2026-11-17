from datetime import datetime
from sqlalchemy.orm import Session
from app.database.unit_of_work import atomic
from app.models.mitigation_action import MitigationAction
from app.repositories.mitigation_action_repository import MitigationActionRepository
from app.repositories.mitigation_plan_repository import MitigationPlanRepository
from app.repositories.user_repository import UserRepository
from app.utils.exceptions import NotFoundError, ValidationAppError
from app.schemas.mitigation_action_schema import MitigationActionCreateRequest, MitigationActionUpdateRequest, MitigationActionOut
from app.utils.validation_errors import body_field_error

VALID_STATUSES = ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]


class MitigationActionService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = MitigationActionRepository(db)
        self.plan_repo = MitigationPlanRepository(db)
        self.user_repo = UserRepository(db)

    def list_by_plan(self, plan_id: int) -> list[MitigationActionOut]:
        return [MitigationActionOut.model_validate(a) for a in self.repo.list_by_plan(plan_id)]

    @atomic
    def create_action(self, plan_id: int, data: MitigationActionCreateRequest) -> MitigationActionOut:
        plan = self.plan_repo.get_by_id(plan_id)
        if not plan:
            raise NotFoundError("Plan de mitigacion no encontrado.", "MITIGATION_PLAN_NOT_FOUND")
        self._validate_responsible(data.responsible_user_id)
        action = MitigationAction(
            mitigation_plan_id=plan_id, title=data.title, description=data.description,
            responsible_user_id=data.responsible_user_id, due_date=data.due_date, status="PENDING",
        )
        action = self.repo.create(action)
        return MitigationActionOut.model_validate(action)

    @atomic
    def update_action(self, action_id: int, data: MitigationActionUpdateRequest) -> MitigationActionOut:
        action = self.repo.get_by_id(action_id)
        if not action:
            raise NotFoundError("Accion de mitigacion no encontrada.", "MITIGATION_ACTION_NOT_FOUND")
        if data.status is not None and data.status not in VALID_STATUSES:
            raise ValidationAppError("Estado de accion invalido.", "INVALID_STATUS", errors=[
                body_field_error("status", "Selecciona un estado de acción válido.", "invalid_choice"),
            ])
        if data.responsible_user_id is not None:
            self._validate_responsible(data.responsible_user_id)

        if data.title is not None:
            action.title = data.title
        if "description" in data.model_fields_set:
            action.description = data.description
        if data.responsible_user_id is not None:
            action.responsible_user_id = data.responsible_user_id
        if data.due_date is not None:
            action.due_date = data.due_date
        if data.status is not None and data.status != action.status:
            action.status = data.status
            if data.status == "COMPLETED":
                action.completed_at = datetime.utcnow()

        action = self.repo.update(action)
        return MitigationActionOut.model_validate(action)

    @atomic
    def delete_action(self, action_id: int) -> None:
        action = self.repo.get_by_id(action_id)
        if not action:
            raise NotFoundError("Accion de mitigacion no encontrada.", "MITIGATION_ACTION_NOT_FOUND")
        self.repo.delete(action)

    def _validate_responsible(self, user_id: int) -> None:
        if not self.user_repo.get_by_id(user_id):
            raise ValidationAppError("El responsable indicado no existe.", "INVALID_RESPONSIBLE", errors=[
                body_field_error("responsible_user_id", "El responsable indicado no existe.", "invalid_reference"),
            ])
