from fastapi import Depends, Header
from sqlalchemy.orm import Session
import jwt
from app.database.session import get_db
from app.repositories.user_repository import UserRepository
from app.utils.jwt_handler import decode_access_token
from app.utils.exceptions import UnauthorizedError
from app.models.user import User


def get_current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise UnauthorizedError("Token de autenticacion no proporcionado.", "MISSING_TOKEN")
    token = authorization.split(" ", 1)[1]
    try:
        payload = decode_access_token(token)
    except jwt.ExpiredSignatureError:
        raise UnauthorizedError("El token ha expirado.", "TOKEN_EXPIRED")
    except jwt.InvalidTokenError:
        raise UnauthorizedError("Token invalido.", "INVALID_TOKEN")

    user_id = int(payload.get("sub"))
    user_repo = UserRepository(db)
    user = user_repo.get_by_id(user_id)
    if not user or not user.is_active:
        raise UnauthorizedError("Usuario no valido o inactivo.", "USER_INACTIVE")
    return user