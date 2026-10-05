from sqlalchemy.orm import Session
from app.models.risk_evaluation import RiskEvaluation
from app.models.risk_history import RiskHistory
from app.repositories.risk_evaluation_repository import RiskEvaluationRepository
from app.repositories.risk_repository import RiskRepository
from app.repositories.risk_history_repository import RiskHistoryRepository
from app.utils.exceptions import NotFoundError
from app.utils.risk_calculator import compute_risk_score, classify_risk_level
from app.schemas.risk_evaluation_schema import RiskEvaluationCreateRequest, RiskEvaluationOut
from app.services.notification_service import NotificationService


class RiskEvaluationService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = RiskEvaluationRepository(db)
        self.risk_repo = RiskRepository(db)
        self.history_repo = RiskHistoryRepository(db)
        self.notification_service = NotificationService(db)

    def list_by_risk(self, risk_id: int) -> list[RiskEvaluationOut]:
        return [RiskEvaluationOut.model_validate(e) for e in self.repo.list_by_risk(risk_id)]

    def evaluate_risk(self, risk_id: int, data: RiskEvaluationCreateRequest, current_user_id: int) -> RiskEvaluationOut:
        risk = self.risk_repo.get_by_id(risk_id)
        if not risk:
            raise NotFoundError("Riesgo no encontrado.", "RISK_NOT_FOUND")

        score = compute_risk_score(data.probability, data.impact)
        level = classify_risk_level(score)

        evaluation = RiskEvaluation(
            risk_id=risk_id, probability=data.probability, impact=data.impact,
            risk_score=score, risk_level=level, evaluated_by=current_user_id,
            observations=data.observations,
        )
        evaluation = self.repo.create(evaluation)

        old_level = risk.risk_level
        risk.probability = data.probability
        risk.impact = data.impact
        risk.risk_score = score
        risk.risk_level = level
        if risk.status == "IDENTIFIED":
            risk.status = "ASSESSED"
        self.risk_repo.update(risk)

        self.history_repo.create(RiskHistory(
            risk_id=risk_id, user_id=current_user_id, action="EVALUATED",
            old_value=old_level, new_value=level,
        ))

        if level == "CRITICAL" and old_level != "CRITICAL":
            self.notification_service.notify_risk_critical(risk)

        return RiskEvaluationOut.model_validate(evaluation)