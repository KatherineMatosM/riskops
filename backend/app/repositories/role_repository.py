from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.role import Role


class RoleRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, role_id: int) -> Role | None:
        return self.db.get(Role, role_id)

    def get_by_name(self, name: str) -> Role | None:
        stmt = select(Role).where(Role.name == name)
        return self.db.execute(stmt).scalar_one_or_none()

    def list_all(self) -> list[Role]:
        return list(self.db.execute(select(Role)).scalars().all())

    def create(self, role: Role) -> Role:
        self.db.add(role)
        self.db.commit()
        self.db.refresh(role)
        return role

    def get_ids_by_names(self, names: list[str]) -> list[int]:
        stmt = select(Role.id).where(Role.name.in_(names))
        return list(self.db.execute(stmt).scalars().all())