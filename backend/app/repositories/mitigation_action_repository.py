from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.mitigation_action import MitigationAction


class MitigationActionRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, action_id: int) -> MitigationAction | None:
        return self.db.get(MitigationAction, action_id)

    def list_by_plan(self, plan_id: int) -> list[MitigationAction]:
        stmt = select(MitigationAction).where(MitigationAction.mitigation_plan_id == plan_id)
        return list(self.db.execute(stmt).scalars().all())

    def create(self, action: MitigationAction) -> MitigationAction:
        self.db.add(action)
        self.db.commit()
        self.db.refresh(action)
        return action

    def update(self, action: MitigationAction) -> MitigationAction:
        self.db.commit()
        self.db.refresh(action)
        return action

    def delete(self, action: MitigationAction) -> None:
        self.db.delete(action)
        self.db.commit()