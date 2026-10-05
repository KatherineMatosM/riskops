from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.middleware.auth_middleware import get_current_user
from app.schemas.auth_schema import LoginRequest, RegisterRequest, ChangePasswordRequest
from app.controllers import auth_controller
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register")
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    return auth_controller.register(data, db)


@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    return auth_controller.login(data, db)


@router.post("/change-password")
def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return auth_controller.change_password(data, current_user, db)


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return auth_controller.get_me(current_user, db)