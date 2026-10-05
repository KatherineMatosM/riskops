from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.middleware.auth_middleware import get_current_user
from app.middleware.role_middleware import require_roles
from app.schemas.mitigation_plan_schema import MitigationPlanCreateRequest, MitigationPlanUpdateRequest
from app.controllers import mitigation_plan_controller
from app.config.security import RoleName
from app.models.user import User

router = APIRouter(tags=["Mitigation Plans"])


@router.get("/risks/{risk_id}/mitigation-plans")
def list_plans_by_risk(risk_id: int, db: Session = Depends(get_db)):
    return mitigation_plan_controller.list_plans_by_risk(risk_id, db)


@router.post(
    "/risks/{risk_id}/mitigation-plans",
    dependencies=[Depends(require_roles(RoleName.ADMIN, RoleName.RISK_MANAGER, RoleName.ANALYST))],
)
def create_plan(
    risk_id: int,
    data: MitigationPlanCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return mitigation_plan_controller.create_plan(risk_id, data, current_user, db)


@router.get("/mitigation-plans/{plan_id}")
def get_plan(plan_id: int, db: Session = Depends(get_db)):
    return mitigation_plan_controller.get_plan(plan_id, db)


@router.put(
    "/mitigation-plans/{plan_id}",
    dependencies=[Depends(require_roles(RoleName.ADMIN, RoleName.RISK_MANAGER, RoleName.ANALYST))],
)
def update_plan(plan_id: int, data: MitigationPlanUpdateRequest, db: Session = Depends(get_db)):
    return mitigation_plan_controller.update_plan(plan_id, data, db)


@router.delete(
    "/mitigation-plans/{plan_id}",
    dependencies=[Depends(require_roles(RoleName.ADMIN, RoleName.RISK_MANAGER))],
)
def delete_plan(plan_id: int, db: Session = Depends(get_db)):
    return mitigation_plan_controller.delete_plan(plan_id, db)