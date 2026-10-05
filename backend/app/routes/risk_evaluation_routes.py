from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.middleware.auth_middleware import get_current_user
from app.middleware.role_middleware import require_roles
from app.schemas.risk_evaluation_schema import RiskEvaluationCreateRequest
from app.controllers import risk_evaluation_controller
from app.config.security import RoleName
from app.models.user import User

router = APIRouter(prefix="/risks/{risk_id}/evaluations", tags=["Risk Evaluations"])


@router.get("")
def list_evaluations(risk_id: int, db: Session = Depends(get_db)):
    return risk_evaluation_controller.list_evaluations(risk_id, db)


@router.post("", dependencies=[Depends(require_roles(RoleName.ADMIN, RoleName.RISK_MANAGER, RoleName.ANALYST))])
def evaluate_risk(
    risk_id: int,
    data: RiskEvaluationCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return risk_evaluation_controller.evaluate_risk(risk_id, data, current_user, db)