from datetime import date, timedelta
import pytest
from sqlalchemy import event, select

from app.models.mitigation_plan import MitigationPlan
from app.models.risk import Risk
from app.models.risk_category import RiskCategory
from app.repositories.mitigation_plan_repository import MitigationPlanRepository
from app.services.analytics_service import AnalyticsService
from app.services.dashboard_service import DashboardService
from app.services import analytics_service, dashboard_service


REFERENCE_DATE = date(2030, 1, 15)


@pytest.fixture
def plans_with_boundaries(db_session, user_factory):
    user = user_factory("ADMIN")
    category_id = db_session.scalar(select(RiskCategory.id).order_by(RiskCategory.id))
    risk = Risk(title="Riesgo para clasificar planes", category_id=category_id, created_by=user.id)
    db_session.add(risk)
    db_session.flush()
    cases = [
        ("planned_past", "PLANNED", -1),
        ("progress_past", "IN_PROGRESS", -1),
        ("manual_past", "OVERDUE", -1),
        ("manual_future", "OVERDUE", 2),
        ("planned_today", "PLANNED", 0),
        ("progress_today", "IN_PROGRESS", 0),
        ("planned_future", "PLANNED", 2),
        ("completed_past", "COMPLETED", -1),
        ("cancelled_past", "CANCELLED", -1),
    ]
    plans = {}
    for title, status, offset in cases:
        plan = MitigationPlan(
            risk_id=risk.id, title=title, responsible_user_id=user.id,
            start_date=REFERENCE_DATE - timedelta(days=10),
            due_date=REFERENCE_DATE + timedelta(days=offset), status=status,
            progress=100 if status == "COMPLETED" else 0,
        )
        db_session.add(plan)
        plans[title] = plan
    db_session.commit()
    return {title: (plan.id, plan.status) for title, plan in plans.items()}


def expected_overdue_ids(plans):
    return {plans[title][0] for title in ("planned_past", "progress_past", "manual_past", "manual_future")}


def test_overdue_predicate_respects_boundary_manual_status_and_terminal_exclusions(db_session, plans_with_boundaries):
    repo = MitigationPlanRepository(db_session)
    overdue_ids = {plan.id for plan in repo.list_overdue(REFERENCE_DATE)}
    assert overdue_ids == expected_overdue_ids(plans_with_boundaries)

    tomorrow_ids = {plan.id for plan in repo.list_overdue(REFERENCE_DATE + timedelta(days=1))}
    assert tomorrow_ids == overdue_ids | {
        plans_with_boundaries["planned_today"][0], plans_with_boundaries["progress_today"][0],
    }


def test_summary_graph_and_analytics_use_the_same_overdue_population(db_session, plans_with_boundaries):
    dashboard = DashboardService(db_session)
    summary = dashboard.get_summary(REFERENCE_DATE)
    points = dashboard.get_mitigations_by_status(REFERENCE_DATE)
    graph = {point.label: point.value for point in points}
    analytics = AnalyticsService(db_session).build_analytics(REFERENCE_DATE)

    assert summary.active_mitigation_plans == 7
    assert summary.overdue_mitigation_plans == 4
    assert graph == {"PLANNED": 2, "IN_PROGRESS": 1, "COMPLETED": 1, "CANCELLED": 1, "OVERDUE": 4}
    assert sum(graph.values()) == len(plans_with_boundaries)
    assert graph["OVERDUE"] == summary.overdue_mitigation_plans
    assert {plan["id"] for plan in analytics.overdue_mitigations} == expected_overdue_ids(plans_with_boundaries)
    assert {plan["id"]: plan["status"] for plan in analytics.overdue_mitigations} == {
        plan_id: status for plan_id, status in plans_with_boundaries.values() if plan_id in expected_overdue_ids(plans_with_boundaries)
    }
    recommendation = next(item for item in analytics.recommendations if item.type == "OVERDUE_MITIGATION")
    assert set(recommendation.related_ids) == expected_overdue_ids(plans_with_boundaries)


def test_empty_mitigation_graph_retains_every_zero_bucket(db_session):
    points = DashboardService(db_session).get_mitigations_by_status(REFERENCE_DATE)
    assert [(point.label, point.value) for point in points] == [
        ("PLANNED", 0), ("IN_PROGRESS", 0), ("COMPLETED", 0), ("CANCELLED", 0), ("OVERDUE", 0),
    ]
    summary = DashboardService(db_session).get_summary(REFERENCE_DATE)
    assert summary.active_mitigation_plans == summary.overdue_mitigation_plans == 0


def test_overdue_reads_never_rewrite_stored_statuses(db_session, plans_with_boundaries):
    writes = []

    def capture_write(connection, cursor, statement, parameters, context, executemany):
        if statement.lstrip().upper().startswith(("UPDATE", "INSERT", "DELETE")):
            writes.append(statement)

    bind = db_session.get_bind()
    event.listen(bind, "before_cursor_execute", capture_write)
    try:
        DashboardService(db_session).get_summary(REFERENCE_DATE)
        DashboardService(db_session).get_mitigations_by_status(REFERENCE_DATE)
        AnalyticsService(db_session).build_analytics(REFERENCE_DATE)
        db_session.expire_all()
        statuses = dict(db_session.execute(select(MitigationPlan.id, MitigationPlan.status)).all())
    finally:
        event.remove(bind, "before_cursor_execute", capture_write)

    assert writes == []
    assert statuses == {plan_id: status for plan_id, status in plans_with_boundaries.values()}
    assert not db_session.dirty


@pytest.mark.parametrize("service_class,operation,module", [
    (DashboardService, "get_summary", dashboard_service),
    (DashboardService, "get_mitigations_by_status", dashboard_service),
    (AnalyticsService, "build_analytics", analytics_service),
])
def test_operation_resolves_the_reference_date_only_once(db_session, plans_with_boundaries, monkeypatch, service_class, operation, module):
    class CountingDate(date):
        calls = 0

        @classmethod
        def today(cls):
            cls.calls += 1
            return REFERENCE_DATE

    monkeypatch.setattr(module, "date", CountingDate)
    getattr(service_class(db_session), operation)()
    assert CountingDate.calls == 1
    CountingDate.calls = 0
    getattr(service_class(db_session), operation)(REFERENCE_DATE)
    assert CountingDate.calls == 0
