from __future__ import annotations
from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import String, Integer, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base

if TYPE_CHECKING:
    from app.models.risk_category import RiskCategory
    from app.models.risk_evaluation import RiskEvaluation
    from app.models.mitigation_plan import MitigationPlan
    from app.models.risk_history import RiskHistory


class Risk(Base):
    __tablename__ = "risks"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("risk_categories.id"), nullable=False)
    responsible_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="IDENTIFIED", nullable=False)
    probability: Mapped[int | None] = mapped_column(Integer, nullable=True)
    impact: Mapped[int | None] = mapped_column(Integer, nullable=True)
    risk_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    risk_level: Mapped[str | None] = mapped_column(String(20), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    category: Mapped["RiskCategory"] = relationship(back_populates="risks")
    evaluations: Mapped[list["RiskEvaluation"]] = relationship(back_populates="risk", cascade="all, delete-orphan")
    mitigation_plans: Mapped[list["MitigationPlan"]] = relationship(back_populates="risk", cascade="all, delete-orphan")
    history: Mapped[list["RiskHistory"]] = relationship(back_populates="risk", cascade="all, delete-orphan")