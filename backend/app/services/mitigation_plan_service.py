from sqlalchemy.orm import Session
from app.models.mitigation_plan import MitigationPlan
from app.models.risk_history import RiskHistory
from app.repositories.mitigation_plan_repository import MitigationPlanRepository
from app.repositories.risk_repository import RiskRepository
from app.repositories.risk_history_repository import RiskHistoryRepository
from app.utils.exceptions import NotFoundError, ValidationAppError
from app.schemas.mitigation_plan_schema import MitigationPlanCreateRequest, MitigationPlanUpdateRequest, MitigationPlanOut

VALID_STATUSES = ["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "OVERDUE"]


class MitigationPlanService:
    def __init__(self, db: Session):
        self.repo = MitigationPlanRepository(db)
        self.risk_repo = RiskRepository(db)
        self.history_repo = RiskHistoryRepository(db)

    def list_by_risk(self, risk_id: int) -> list[MitigationPlanOut]:
        return [MitigationPlanOut.model_validate(p) for p in self.repo.list_by_risk(risk_id)]

    def get_plan(self, plan_id: int) -> MitigationPlanOut:
        plan = self.repo.get_by_id(plan_id)
        if not plan:
            raise NotFoundError("Plan de mitigacion no encontrado.", "MITIGATION_PLAN_NOT_FOUND")
        return MitigationPlanOut.model_validate(plan)

    def create_plan(self, risk_id: int, data: MitigationPlanCreateRequest, current_user_id: int) -> MitigationPlanOut:
        risk = self.risk_repo.get_by_id(risk_id)
        if not risk:
            raise NotFoundError("Riesgo no encontrado.", "RISK_NOT_FOUND")

        plan = MitigationPlan(
            risk_id=risk_id, title=data.title, description=data.description,
            responsible_user_id=data.responsible_user_id, start_date=data.start_date,
            due_date=data.due_date, status="PLANNED", progress=0,
        )
        plan = self.repo.create(plan)

        if risk.status in ("IDENTIFIED", "ASSESSED"):
            risk.status = "MITIGATION_IN_PROGRESS"
            self.risk_repo.update(risk)

        self.history_repo.create(RiskHistory(
            risk_id=risk_id, user_id=current_user_id, action="MITIGATION_PLAN_CREATED",
            old_value=None, new_value=data.title,
        ))
        return MitigationPlanOut.model_validate(plan)

    def update_plan(self, plan_id: int, data: MitigationPlanUpdateRequest) -> MitigationPlanOut:
        plan = self.repo.get_by_id(plan_id)
        if not plan:
            raise NotFoundError("Plan de mitigacion no encontrado.", "MITIGATION_PLAN_NOT_FOUND")

        if data.status is not None and data.status not in VALID_STATUSES:
            raise ValidationAppError("Estado de plan invalido.", "INVALID_STATUS")

        if data.title is not None:
            plan.title = data.title
        if data.description is not None:
            plan.description = data.description
        if data.responsible_user_id is not None:
            plan.responsible_user_id = data.responsible_user_id
        if data.start_date is not None:
            plan.start_date = data.start_date
        if data.due_date is not None:
            plan.due_date = data.due_date
        if data.status is not None:
            plan.status = data.status
        if data.progress is not None:
            plan.progress = data.progress
            if data.progress == 100:
                plan.status = "COMPLETED"

        plan = self.repo.update(plan)
        return MitigationPlanOut.model_validate(plan)

    def delete_plan(self, plan_id: int) -> None:
        plan = self.repo.get_by_id(plan_id)
        if not plan:
            raise NotFoundError("Plan de mitigacion no encontrado.", "MITIGATION_PLAN_NOT_FOUND")
        self.repo.delete(plan)