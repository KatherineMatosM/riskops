from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.middleware.role_middleware import require_roles
from app.middleware.auth_middleware import get_current_user
from app.schemas.user_schema import UserCreateRequest, UserUpdateRequest, UserProfileUpdateRequest
from app.controllers import user_controller
from app.config.security import RoleName
from app.models.user import User

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("", dependencies=[Depends(require_roles(RoleName.ADMIN, RoleName.RISK_MANAGER))])
def list_users(db: Session = Depends(get_db)):
    return user_controller.list_users(db)


@router.get("/{user_id}", dependencies=[Depends(require_roles(RoleName.ADMIN, RoleName.RISK_MANAGER))])
def get_user(user_id: int, db: Session = Depends(get_db)):
    return user_controller.get_user(user_id, db)


@router.post("", dependencies=[Depends(require_roles(RoleName.ADMIN))])
def create_user(data: UserCreateRequest, db: Session = Depends(get_db)):
    return user_controller.create_user(data, db)


@router.put("/{user_id}", dependencies=[Depends(require_roles(RoleName.ADMIN))])
def update_user(user_id: int, data: UserUpdateRequest, db: Session = Depends(get_db)):
    return user_controller.update_user(user_id, data, db)


@router.put("/me/profile")
def update_my_profile(
    data: UserProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return user_controller.update_my_profile(data, current_user, db)


@router.delete("/{user_id}", dependencies=[Depends(require_roles(RoleName.ADMIN))])
def delete_user(user_id: int, db: Session = Depends(get_db)):
    return user_controller.delete_user(user_id, db)