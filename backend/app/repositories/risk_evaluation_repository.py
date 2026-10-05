from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.risk_evaluation import RiskEvaluation


class RiskEvaluationRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, evaluation: RiskEvaluation) -> RiskEvaluation:
        self.db.add(evaluation)
        self.db.commit()
        self.db.refresh(evaluation)
        return evaluation

    def list_by_risk(self, risk_id: int) -> list[RiskEvaluation]:
        stmt = (
            select(RiskEvaluation)
            .where(RiskEvaluation.risk_id == risk_id)
            .order_by(RiskEvaluation.evaluation_date.desc())
        )
        return list(self.db.execute(stmt).scalars().all())