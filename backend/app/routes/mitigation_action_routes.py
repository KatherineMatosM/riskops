from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.middleware.role_middleware import require_roles
from app.schemas.mitigation_action_schema import MitigationActionCreateRequest, MitigationActionUpdateRequest
from app.controllers import mitigation_action_controller
from app.config.security import RoleName

router = APIRouter(tags=["Mitigation Actions"])


@router.get("/mitigation-plans/{plan_id}/actions")
def list_actions_by_plan(plan_id: int, db: Session = Depends(get_db)):
    return mitigation_action_controller.list_actions_by_plan(plan_id, db)


@router.post(
    "/mitigation-plans/{plan_id}/actions",
    dependencies=[Depends(require_roles(RoleName.ADMIN, RoleName.RISK_MANAGER, RoleName.ANALYST))],
)
def create_action(plan_id: int, data: MitigationActionCreateRequest, db: Session = Depends(get_db)):
    return mitigation_action_controller.create_action(plan_id, data, db)


@router.put(
    "/mitigation-actions/{action_id}",
    dependencies=[Depends(require_roles(RoleName.ADMIN, RoleName.RISK_MANAGER, RoleName.ANALYST))],
)
def update_action(action_id: int, data: MitigationActionUpdateRequest, db: Session = Depends(get_db)):
    return mitigation_action_controller.update_action(action_id, data, db)


@router.delete(
    "/mitigation-actions/{action_id}",
    dependencies=[Depends(require_roles(RoleName.ADMIN, RoleName.RISK_MANAGER))],
)
def delete_action(action_id: int, db: Session = Depends(get_db)):
    return mitigation_action_controller.delete_action(action_id, db)