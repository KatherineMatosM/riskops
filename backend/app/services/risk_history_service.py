from sqlalchemy.orm import Session
from app.repositories.risk_history_repository import RiskHistoryRepository
from app.schemas.risk_history_schema import RiskHistoryOut


class RiskHistoryService:
    def __init__(self, db: Session):
        self.repo = RiskHistoryRepository(db)

    def list_by_risk(self, risk_id: int) -> list[RiskHistoryOut]:
        return [RiskHistoryOut.model_validate(h) for h in self.repo.list_by_risk(risk_id)]