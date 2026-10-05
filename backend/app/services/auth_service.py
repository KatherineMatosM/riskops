from sqlalchemy.orm import Session
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.repositories.role_repository import RoleRepository
from app.utils.password_hasher import hash_password, verify_password
from app.utils.jwt_handler import create_access_token
from app.utils.exceptions import UnauthorizedError, ConflictError
from app.schemas.auth_schema import LoginRequest, RegisterRequest, ChangePasswordRequest
from app.schemas.user_schema import UserOut


class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)
        self.role_repo = RoleRepository(db)

    def register(self, data: RegisterRequest) -> UserOut:
        if self.user_repo.get_by_email(data.email):
            raise ConflictError("El correo ya esta registrado.", "EMAIL_ALREADY_EXISTS")
        user = User(
            full_name=data.full_name,
            email=data.email,
            password_hash=hash_password(data.password),
            is_active=True,
        )
        user = self.user_repo.create(user)
        viewer_role = self.role_repo.get_by_name("VIEWER")
        if viewer_role:
            self.user_repo.set_roles(user, [viewer_role.id])
        return self.to_user_out(user)

    def login(self, data: LoginRequest) -> tuple[str, UserOut]:
        user = self.user_repo.get_by_email(data.email)
        if not user or not verify_password(data.password, user.password_hash):
            raise UnauthorizedError("Credenciales invalidas.", "INVALID_CREDENTIALS")
        if not user.is_active:
            raise UnauthorizedError("Usuario inactivo.", "USER_INACTIVE")
        roles = self.user_repo.get_role_names(user.id)
        token = create_access_token(subject=str(user.id), extra_claims={"roles": roles})
        return token, self.to_user_out(user)

    def change_password(self, user_id: int, data: ChangePasswordRequest) -> None:
        user = self.user_repo.get_by_id(user_id)
        if not user or not verify_password(data.current_password, user.password_hash):
            raise UnauthorizedError("La contrasena actual es incorrecta.", "INVALID_CURRENT_PASSWORD")
        user.password_hash = hash_password(data.new_password)
        self.user_repo.update(user)

    def to_user_out(self, user: User) -> UserOut:
        roles = self.user_repo.get_role_names(user.id)
        return UserOut(
            id=user.id, full_name=user.full_name, email=user.email,
            is_active=user.is_active, roles=roles, created_at=user.created_at,
        )