from sqlalchemy.orm import Session
from app.models.user import User
from app.models.role import Role
from app.models.user_role import UserRole
from app.utils.password_hasher import hash_password
from app.config.settings import settings
from app.config.security import RoleName


def seed_admin_user(db: Session) -> None:
    existing = db.query(User).filter(User.email == settings.ADMIN_EMAIL).first()
    if existing:
        return

    admin = User(
        full_name=settings.ADMIN_FULL_NAME,
        email=settings.ADMIN_EMAIL,
        password_hash=hash_password(settings.ADMIN_PASSWORD),
        is_active=True,
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)

    admin_role = db.query(Role).filter(Role.name == RoleName.ADMIN).first()
    if admin_role:
        db.add(UserRole(user_id=admin.id, role_id=admin_role.id))
        db.commit()