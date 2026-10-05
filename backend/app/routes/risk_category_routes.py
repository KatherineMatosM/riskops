from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.middleware.role_middleware import require_roles
from app.schemas.risk_category_schema import RiskCategoryCreateRequest, RiskCategoryUpdateRequest
from app.controllers import risk_category_controller
from app.config.security import RoleName

router = APIRouter(prefix="/risk-categories", tags=["Risk Categories"])


@router.get("")
def list_categories(db: Session = Depends(get_db)):
    return risk_category_controller.list_categories(db)


@router.get("/{category_id}")
def get_category(category_id: int, db: Session = Depends(get_db)):
    return risk_category_controller.get_category(category_id, db)


@router.post("", dependencies=[Depends(require_roles(RoleName.ADMIN, RoleName.RISK_MANAGER))])
def create_category(data: RiskCategoryCreateRequest, db: Session = Depends(get_db)):
    return risk_category_controller.create_category(data, db)


@router.put("/{category_id}", dependencies=[Depends(require_roles(RoleName.ADMIN, RoleName.RISK_MANAGER))])
def update_category(category_id: int, data: RiskCategoryUpdateRequest, db: Session = Depends(get_db)):
    return risk_category_controller.update_category(category_id, data, db)


@router.delete("/{category_id}", dependencies=[Depends(require_roles(RoleName.ADMIN))])
def delete_category(category_id: int, db: Session = Depends(get_db)):
    return risk_category_controller.delete_category(category_id, db)