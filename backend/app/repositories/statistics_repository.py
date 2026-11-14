from datetime import date
from sqlalchemy import case, func, literal_column, or_, select
from sqlalchemy.orm import Session

from app.models.mitigation_plan import MitigationPlan
from app.models.risk import Risk
from app.models.risk_category import RiskCategory
from app.utils.mitigation_status import ACTIVE_PLAN_STATUSES, overdue_plan_condition
from app.utils.statistics_queries import exact_code_equals, exact_string_group, year_month_columns


class RiskStatisticsRepository:
    """Read-only scalar aggregates; never load Risk entities or their relationships."""

    def __init__(self, db: Session):
        self.db = db

    def _group(self, expression):
        return exact_string_group(expression, self.db.get_bind().dialect.name)

    def summary_counts(self) -> dict[str, int]:
        dialect_name = self.db.get_bind().dialect.name
        closed = exact_code_equals(Risk.status, "CLOSED", dialect_name)
        conditions = {
            "critical_risks": exact_code_equals(Risk.risk_level, "CRITICAL", dialect_name),
            "high_risks": exact_code_equals(Risk.risk_level, "HIGH", dialect_name),
            "medium_risks": exact_code_equals(Risk.risk_level, "MEDIUM", dialect_name),
            "low_risks": exact_code_equals(Risk.risk_level, "LOW", dialect_name),
            "open_risks": ~closed,
            "closed_risks": closed,
        }
        stmt = select(
            func.count(Risk.id).label("total_risks"),
            *(func.count(case((condition, 1))).label(name) for name, condition in conditions.items()),
        )
        return {key: int(value) for key, value in self.db.execute(stmt).one()._mapping.items()}

    def _counts_by(self, column) -> dict[str, int]:
        expression, keys = self._group(column)
        stmt = select(expression.label("label"), func.count(Risk.id).label("count")).group_by(*keys)
        return {row.label: int(row._mapping["count"]) for row in self.db.execute(stmt).all()}

    def counts_by_level(self) -> dict[str, int]:
        return self._counts_by(Risk.risk_level)

    def counts_by_status(self) -> dict[str, int]:
        return self._counts_by(Risk.status)

    def _category_group(self):
        # A static SQL literal keeps SELECT/GROUP BY identical with positional drivers.
        category = func.coalesce(RiskCategory.name, literal_column("'Sin categoria'"))
        return self._group(category)

    def counts_by_category(self) -> list[dict]:
        category, keys = self._category_group()
        stmt = (
            select(category.label("category"), func.count(Risk.id).label("count"))
            .select_from(Risk)
            .outerjoin(RiskCategory, RiskCategory.id == Risk.category_id)
            .group_by(*keys)
            .order_by(func.min(Risk.id))
        )
        return [{"category": row.category, "count": int(row._mapping["count"])} for row in self.db.execute(stmt).all()]

    def counts_by_month(self) -> list[dict]:
        year, month = year_month_columns(Risk.created_at)
        stmt = (
            select(year.label("year"), month.label("month"), func.count(Risk.id).label("count"))
            .where(Risk.created_at.is_not(None))
            .group_by(year, month)
            .order_by(year, month)
        )
        return [
            {"label": f"{int(row.year):04d}-{int(row.month):02d}", "value": int(row._mapping["count"])}
            for row in self.db.execute(stmt).all()
        ]

    def recurring_titles(self) -> list[dict]:
        title, keys = self._group(Risk.title)
        stmt = (
            select(title.label("title"), func.count(Risk.id).label("count"))
            .group_by(*keys)
            .having(func.count(Risk.id) > 1)
        )
        results = [{"title": row.title, "count": int(row._mapping["count"])} for row in self.db.execute(stmt).all()]
        return sorted(results, key=lambda item: item["title"])

    def counts_by_category_month(self) -> list[dict]:
        category, keys = self._category_group()
        year, month = year_month_columns(Risk.created_at)
        stmt = (
            select(category.label("category"), year.label("year"), month.label("month"), func.count(Risk.id).label("count"))
            .select_from(Risk)
            .outerjoin(RiskCategory, RiskCategory.id == Risk.category_id)
            .where(Risk.created_at.is_not(None))
            .group_by(*keys, year, month)
        )
        return [
            {"category": row.category, "month": f"{int(row.year):04d}-{int(row.month):02d}", "count": int(row._mapping["count"])}
            for row in self.db.execute(stmt).all()
        ]

    def matrix_coordinates(self) -> list[tuple[int, int, int]]:
        stmt = (
            select(Risk.id, Risk.probability, Risk.impact)
            .where(Risk.probability.is_not(None), Risk.impact.is_not(None))
            .order_by(Risk.id)
        )
        return [(row.id, row.probability, row.impact) for row in self.db.execute(stmt).all()]


class MitigationStatisticsRepository:
    def __init__(self, db: Session):
        self.db = db

    def summary_counts(self, reference_date: date) -> dict[str, int]:
        dialect_name = self.db.get_bind().dialect.name
        active = or_(*(
            exact_code_equals(MitigationPlan.status, status, dialect_name)
            for status in ACTIVE_PLAN_STATUSES
        ))
        stmt = select(
            func.count(case((active, 1))).label("active_mitigation_plans"),
            func.count(case((overdue_plan_condition(reference_date), 1))).label("overdue_mitigation_plans"),
        )
        return {key: int(value) for key, value in self.db.execute(stmt).one()._mapping.items()}

    def counts_by_effective_status(self, reference_date: date) -> dict[str, int]:
        # Group the derived column rather than repeating a parameterized CASE in GROUP BY.
        effective = select(case(
            (overdue_plan_condition(reference_date), literal_column("'OVERDUE'")),
            else_=MitigationPlan.status,
        ).label("status")).subquery()
        status, keys = exact_string_group(effective.c.status, self.db.get_bind().dialect.name)
        stmt = select(status.label("label"), func.count().label("count")).group_by(*keys)
        return {row.label: int(row._mapping["count"]) for row in self.db.execute(stmt).all()}

    def overdue_projection(self, reference_date: date) -> list[dict]:
        stmt = (
            select(MitigationPlan.id, MitigationPlan.title, MitigationPlan.due_date, MitigationPlan.status)
            .where(overdue_plan_condition(reference_date))
            .order_by(MitigationPlan.id)
        )
        return [
            {"id": row.id, "title": row.title, "due_date": str(row.due_date), "status": row.status}
            for row in self.db.execute(stmt).all()
        ]
