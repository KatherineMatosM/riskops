from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.risk_category import RiskCategory


class RiskCategoryRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, category_id: int) -> RiskCategory | None:
        return self.db.get(RiskCategory, category_id)

    def get_by_name(self, name: str) -> RiskCategory | None:
        stmt = select(RiskCategory).where(RiskCategory.name == name)
        return self.db.execute(stmt).scalar_one_or_none()

    def list_all(self) -> list[RiskCategory]:
        return list(self.db.execute(select(RiskCategory)).scalars().all())

    def create(self, category: RiskCategory) -> RiskCategory:
        self.db.add(category)
        self.db.commit()
        self.db.refresh(category)
        return category

    def update(self, category: RiskCategory) -> RiskCategory:
        self.db.commit()
        self.db.refresh(category)
        return category

    def delete(self, category: RiskCategory) -> None:
        self.db.delete(category)
        self.db.commit()