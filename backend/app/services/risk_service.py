from sqlalchemy.orm import Session
from app.models.risk import Risk
from app.models.risk_history import RiskHistory
from app.repositories.risk_repository import RiskRepository
from app.repositories.risk_category_repository import RiskCategoryRepository
from app.repositories.risk_history_repository import RiskHistoryRepository
from app.utils.exceptions import NotFoundError, ValidationAppError
from app.utils.risk_calculator import compute_risk_score, classify_risk_level
from app.schemas.risk_schema import RiskCreateRequest, RiskUpdateRequest, RiskOut, RiskFilterParams
from app.services.notification_service import NotificationService

VALID_STATUSES = ["IDENTIFIED", "ASSESSED", "MITIGATION_IN_PROGRESS", "MONITORED", "CLOSED"]


class RiskService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = RiskRepository(db)
        self.category_repo = RiskCategoryRepository(db)
        self.history_repo = RiskHistoryRepository(db)
        self.notification_service = NotificationService(db)

    def list_risks(self, filters: RiskFilterParams) -> tuple[list[RiskOut], int]:
        items, total = self.repo.list_filtered(
            category_id=filters.category_id, status=filters.status, risk_level=filters.risk_level,
            responsible_user_id=filters.responsible_user_id, search=filters.search,
            page=filters.page, page_size=filters.page_size, sort_by=filters.sort_by, sort_dir=filters.sort_dir,
        )
        return [RiskOut.model_validate(r) for r in items], total

    def get_risk(self, risk_id: int) -> RiskOut:
        risk = self.repo.get_by_id(risk_id)
        if not risk:
            raise NotFoundError("Riesgo no encontrado.", "RISK_NOT_FOUND")
        return RiskOut.model_validate(risk)

    def create_risk(self, data: RiskCreateRequest, current_user_id: int) -> RiskOut:
        category = self.category_repo.get_by_id(data.category_id)
        if not category:
            raise ValidationAppError("La categoria indicada no existe.", "INVALID_CATEGORY")

        risk = Risk(
            title=data.title, description=data.description, category_id=data.category_id,
            responsible_user_id=data.responsible_user_id, created_by=current_user_id,
            status="IDENTIFIED",
        )
        if data.probability is not None and data.impact is not None:
            risk.probability = data.probability
            risk.impact = data.impact
            risk.risk_score = compute_risk_score(data.probability, data.impact)
            risk.risk_level = classify_risk_level(risk.risk_score)
            risk.status = "ASSESSED"

        risk = self.repo.create(risk)
        self._log_history(risk.id, current_user_id, "CREATED", None, risk.title)

        if risk.risk_level == "CRITICAL":
            self.notification_service.notify_risk_critical(risk)

        return RiskOut.model_validate(risk)

    def update_risk(self, risk_id: int, data: RiskUpdateRequest, current_user_id: int) -> RiskOut:
        risk = self.repo.get_by_id(risk_id)
        if not risk:
            raise NotFoundError("Riesgo no encontrado.", "RISK_NOT_FOUND")

        if data.category_id is not None and not self.category_repo.get_by_id(data.category_id):
            raise ValidationAppError("La categoria indicada no existe.", "INVALID_CATEGORY")

        if data.status is not None and data.status not in VALID_STATUSES:
            raise ValidationAppError("Estado de riesgo invalido.", "INVALID_STATUS")

        if data.title is not None:
            risk.title = data.title
        if data.description is not None:
            risk.description = data.description
        if data.category_id is not None:
            risk.category_id = data.category_id
        if data.responsible_user_id is not None and data.responsible_user_id != risk.responsible_user_id:
            old_responsible = risk.responsible_user_id
            risk.responsible_user_id = data.responsible_user_id
            self._log_history(risk.id, current_user_id, "RESPONSIBLE_CHANGED", str(old_responsible), str(data.responsible_user_id))
            self.notification_service.notify_risk_assigned(risk)
        if data.status is not None and data.status != risk.status:
            old_status = risk.status
            risk.status = data.status
            self._log_history(risk.id, current_user_id, "STATUS_CHANGED", old_status, data.status)

        risk = self.repo.update(risk)
        return RiskOut.model_validate(risk)

    def delete_risk(self, risk_id: int, current_user_id: int) -> None:
        risk = self.repo.get_by_id(risk_id)
        if not risk:
            raise NotFoundError("Riesgo no encontrado.", "RISK_NOT_FOUND")
        self._log_history(risk.id, current_user_id, "DELETED", risk.title, None)
        self.repo.delete(risk)

    def _log_history(self, risk_id: int, user_id: int, action: str, old_value: str | None, new_value: str | None) -> None:
        entry = RiskHistory(risk_id=risk_id, user_id=user_id, action=action, old_value=old_value, new_value=new_value)
        self.history_repo.create(entry)