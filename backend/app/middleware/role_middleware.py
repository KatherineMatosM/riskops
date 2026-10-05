from fastapi import Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.middleware.auth_middleware import get_current_user
from app.repositories.user_repository import UserRepository
from app.models.user import User
from app.utils.exceptions import ForbiddenError


def require_roles(*allowed_roles: str):
    def dependency(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ) -> User:
        user_repo = UserRepository(db)
        roles = user_repo.get_role_names(current_user.id)
        if not any(role in allowed_roles for role in roles):
            raise ForbiddenError("No tienes permisos para realizar esta accion.", "FORBIDDEN_ROLE")
        return current_user
    return dependency