from datetime import date
from sqlalchemy import and_, or_
from app.models.mitigation_plan import MitigationPlan


ACTIVE_PLAN_STATUSES = ("PLANNED", "IN_PROGRESS", "OVERDUE")
TERMINAL_PLAN_STATUSES = ("COMPLETED", "CANCELLED")


def overdue_plan_condition(reference_date: date):
    """Read-time overdue classification, including an explicitly stored overdue status."""
    return and_(
        MitigationPlan.status.notin_(TERMINAL_PLAN_STATUSES),
        or_(
            MitigationPlan.due_date < reference_date,
            MitigationPlan.status == "OVERDUE",
        ),
    )
