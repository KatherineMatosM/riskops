from datetime import date
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.mitigation_plan import MitigationPlan
from app.utils.mitigation_status import overdue_plan_condition


class MitigationPlanRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, plan_id: int) -> MitigationPlan | None:
        return self.db.get(MitigationPlan, plan_id)

    def list_by_risk(self, risk_id: int) -> list[MitigationPlan]:
        stmt = select(MitigationPlan).where(MitigationPlan.risk_id == risk_id)
        return list(self.db.execute(stmt).scalars().all())

    def list_all(self) -> list[MitigationPlan]:
        return list(self.db.execute(select(MitigationPlan)).scalars().all())

    def list_overdue(self, reference_date: date) -> list[MitigationPlan]:
        stmt = select(MitigationPlan).where(overdue_plan_condition(reference_date))
        return list(self.db.execute(stmt).scalars().all())

    def create(self, plan: MitigationPlan) -> MitigationPlan:
        self.db.add(plan)
        self.db.flush()
        self.db.refresh(plan)
        return plan

    def update(self, plan: MitigationPlan) -> MitigationPlan:
        self.db.flush()
        self.db.refresh(plan)
        return plan

    def delete(self, plan: MitigationPlan) -> None:
        self.db.delete(plan)
        self.db.flush()
