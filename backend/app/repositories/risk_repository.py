from sqlalchemy import select, func, or_
from sqlalchemy.orm import Session
from app.models.risk import Risk


class RiskRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, risk_id: int) -> Risk | None:
        return self.db.get(Risk, risk_id)

    def create(self, risk: Risk) -> Risk:
        self.db.add(risk)
        self.db.commit()
        self.db.refresh(risk)
        return risk

    def update(self, risk: Risk) -> Risk:
        self.db.commit()
        self.db.refresh(risk)
        return risk

    def delete(self, risk: Risk) -> None:
        self.db.delete(risk)
        self.db.commit()

    def list_filtered(
        self,
        category_id: int | None,
        status: str | None,
        risk_level: str | None,
        responsible_user_id: int | None,
        search: str | None,
        page: int,
        page_size: int,
        sort_by: str,
        sort_dir: str,
    ) -> tuple[list[Risk], int]:
        stmt = select(Risk)
        if category_id is not None:
            stmt = stmt.where(Risk.category_id == category_id)
        if status is not None:
            stmt = stmt.where(Risk.status == status)
        if risk_level is not None:
            stmt = stmt.where(Risk.risk_level == risk_level)
        if responsible_user_id is not None:
            stmt = stmt.where(Risk.responsible_user_id == responsible_user_id)
        if search:
            like_term = f"%{search}%"
            stmt = stmt.where(or_(Risk.title.ilike(like_term), Risk.description.ilike(like_term)))

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = self.db.execute(count_stmt).scalar_one()

        sort_column = getattr(Risk, sort_by, Risk.created_at)
        stmt = stmt.order_by(sort_column.desc() if sort_dir == "desc" else sort_column.asc())
        stmt = stmt.offset((page - 1) * page_size).limit(page_size)

        items = list(self.db.execute(stmt).scalars().all())
        return items, total

    def list_all(self) -> list[Risk]:
        return list(self.db.execute(select(Risk)).scalars().all())