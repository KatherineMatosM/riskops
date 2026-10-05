from sqlalchemy.orm import Session
from app.schemas.risk_evaluation_schema import RiskEvaluationCreateRequest
from app.services.risk_evaluation_service import RiskEvaluationService
from app.utils.response_helper import success_response
from app.models.user import User


def list_evaluations(risk_id: int, db: Session):
    return success_response(RiskEvaluationService(db).list_by_risk(risk_id))


def evaluate_risk(risk_id: int, data: RiskEvaluationCreateRequest, current_user: User, db: Session):
    return success_response(RiskEvaluationService(db).evaluate_risk(risk_id, data, current_user.id))