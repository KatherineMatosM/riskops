from sqlalchemy.orm import Session
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.repositories.role_repository import RoleRepository
from app.utils.password_hasher import hash_password
from app.utils.exceptions import NotFoundError, ConflictError, ValidationAppError
from app.schemas.user_schema import UserCreateRequest, UserUpdateRequest, UserOut, UserProfileUpdateRequest


class UserService:
    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)
        self.role_repo = RoleRepository(db)

    def list_users(self) -> list[UserOut]:
        return [self._to_out(u) for u in self.user_repo.list_all()]

    def get_user(self, user_id: int) -> UserOut:
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundError("Usuario no encontrado.", "USER_NOT_FOUND")
        return self._to_out(user)

    def create_user(self, data: UserCreateRequest) -> UserOut:
        if self.user_repo.get_by_email(data.email):
            raise ConflictError("El correo ya esta registrado.", "EMAIL_ALREADY_EXISTS")
        role_ids = self.role_repo.get_ids_by_names(data.roles)
        if len(role_ids) != len(set(data.roles)):
            raise ValidationAppError("Uno o mas roles no son validos.", "INVALID_ROLE")
        user = User(
            full_name=data.full_name, email=data.email,
            password_hash=hash_password(data.password), is_active=True,
        )
        user = self.user_repo.create(user)
        self.user_repo.set_roles(user, role_ids)
        return self._to_out(user)

    def update_user(self, user_id: int, data: UserUpdateRequest) -> UserOut:
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundError("Usuario no encontrado.", "USER_NOT_FOUND")
        if data.full_name is not None:
            user.full_name = data.full_name
        if data.is_active is not None:
            user.is_active = data.is_active
        self.user_repo.update(user)
        if data.roles is not None:
            role_ids = self.role_repo.get_ids_by_names(data.roles)
            if len(role_ids) != len(set(data.roles)):
                raise ValidationAppError("Uno o mas roles no son validos.", "INVALID_ROLE")
            self.user_repo.set_roles(user, role_ids)
        return self._to_out(user)

    def update_profile(self, user_id: int, data: UserProfileUpdateRequest) -> UserOut:
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundError("Usuario no encontrado.", "USER_NOT_FOUND")
        if data.full_name is not None:
            user.full_name = data.full_name
        self.user_repo.update(user)
        return self._to_out(user)

    def delete_user(self, user_id: int) -> None:
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundError("Usuario no encontrado.", "USER_NOT_FOUND")
        self.user_repo.delete(user)

    def _to_out(self, user: User) -> UserOut:
        roles = self.user_repo.get_role_names(user.id)
        return UserOut(
            id=user.id, full_name=user.full_name, email=user.email,
            is_active=user.is_active, roles=roles, created_at=user.created_at,
        )