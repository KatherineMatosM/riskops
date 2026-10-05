from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.middleware.auth_middleware import get_current_user
from app.middleware.role_middleware import require_roles
from app.schemas.risk_schema import RiskCreateRequest, RiskUpdateRequest, RiskFilterParams
from app.controllers import risk_controller
from app.config.security import RoleName
from app.models.user import User

router = APIRouter(prefix="/risks", tags=["Risks"])


@router.get("")
def list_risks(filters: RiskFilterParams = Depends(), db: Session = Depends(get_db)):
    return risk_controller.list_risks(filters, db)


@router.get("/{risk_id}")
def get_risk(risk_id: int, db: Session = Depends(get_db)):
    return risk_controller.get_risk(risk_id, db)


@router.post("", dependencies=[Depends(require_roles(RoleName.ADMIN, RoleName.RISK_MANAGER, RoleName.ANALYST))])
def create_risk(
    data: RiskCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return risk_controller.create_risk(data, current_user, db)


@router.put("/{risk_id}", dependencies=[Depends(require_roles(RoleName.ADMIN, RoleName.RISK_MANAGER, RoleName.ANALYST))])
def update_risk(
    risk_id: int,
    data: RiskUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return risk_controller.update_risk(risk_id, data, current_user, db)


@router.delete("/{risk_id}", dependencies=[Depends(require_roles(RoleName.ADMIN, RoleName.RISK_MANAGER))])
def delete_risk(
    risk_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return risk_controller.delete_risk(risk_id, current_user, db)