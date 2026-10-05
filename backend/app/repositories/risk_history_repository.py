from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.risk_history import RiskHistory


class RiskHistoryRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, entry: RiskHistory) -> RiskHistory:
        self.db.add(entry)
        self.db.commit()
        self.db.refresh(entry)
        return entry

    def list_by_risk(self, risk_id: int) -> list[RiskHistory]:
        stmt = (
            select(RiskHistory)
            .where(RiskHistory.risk_id == risk_id)
            .order_by(RiskHistory.created_at.desc())
        )
        return list(self.db.execute(stmt).scalars().all())