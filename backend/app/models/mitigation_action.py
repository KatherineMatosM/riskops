from __future__ import annotations
from datetime import datetime, date
from typing import TYPE_CHECKING
from sqlalchemy import String, DateTime, Date, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base

if TYPE_CHECKING:
    from app.models.mitigation_plan import MitigationPlan


class MitigationAction(Base):
    __tablename__ = "mitigation_actions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    mitigation_plan_id: Mapped[int] = mapped_column(ForeignKey("mitigation_plans.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    responsible_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    due_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="PENDING", nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    mitigation_plan: Mapped["MitigationPlan"] = relationship(back_populates="actions")