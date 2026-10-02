from __future__ import annotations
from datetime import datetime, date
from typing import TYPE_CHECKING
from sqlalchemy import String, Integer, DateTime, Date, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base

if TYPE_CHECKING:
    from app.models.risk import Risk
    from app.models.mitigation_action import MitigationAction


class MitigationPlan(Base):
    __tablename__ = "mitigation_plans"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    risk_id: Mapped[int] = mapped_column(ForeignKey("risks.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    responsible_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    due_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="PLANNED", nullable=False)
    progress: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    risk: Mapped["Risk"] = relationship(back_populates="mitigation_plans")
    actions: Mapped[list["MitigationAction"]] = relationship(back_populates="mitigation_plan", cascade="all, delete-orphan")