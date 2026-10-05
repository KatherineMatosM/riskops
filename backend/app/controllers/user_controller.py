from sqlalchemy.orm import Session
from app.schemas.user_schema import UserCreateRequest, UserUpdateRequest, UserProfileUpdateRequest
from app.services.user_service import UserService
from app.utils.response_helper import success_response
from app.models.user import User


def list_users(db: Session):
    return success_response(UserService(db).list_users())


def get_user(user_id: int, db: Session):
    return success_response(UserService(db).get_user(user_id))


def create_user(data: UserCreateRequest, db: Session):
    return success_response(UserService(db).create_user(data))


def update_user(user_id: int, data: UserUpdateRequest, db: Session):
    return success_response(UserService(db).update_user(user_id, data))


def update_my_profile(data: UserProfileUpdateRequest, current_user: User, db: Session):
    return success_response(UserService(db).update_profile(current_user.id, data))


def delete_user(user_id: int, db: Session):
    UserService(db).delete_user(user_id)
    return success_response({"message": "Usuario eliminado correctamente."})