from sqlalchemy.orm import Session
from app.schemas.auth_schema import LoginRequest, RegisterRequest, ChangePasswordRequest
from app.services.auth_service import AuthService
from app.utils.response_helper import success_response
from app.models.user import User


def register(data: RegisterRequest, db: Session):
    service = AuthService(db)
    user = service.register(data)
    return success_response(user)


def login(data: LoginRequest, db: Session):
    service = AuthService(db)
    token, user = service.login(data)
    return success_response({"access_token": token, "token_type": "bearer", "user": user})


def change_password(data: ChangePasswordRequest, current_user: User, db: Session):
    service = AuthService(db)
    service.change_password(current_user.id, data)
    return success_response({"message": "Contrasena actualizada correctamente."})


def get_me(current_user: User, db: Session):
    service = AuthService(db)
    return success_response(service.to_user_out(current_user))