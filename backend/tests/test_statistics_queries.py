from datetime import date, datetime, timedelta
from types import SimpleNamespace
import pytest
from sqlalchemy import event, select
from sqlalchemy.dialects import mssql

from app.models.mitigation_plan import MitigationPlan
from app.models.risk import Risk
from app.models.risk_category import RiskCategory
from app.repositories.mitigation_plan_repository import MitigationPlanRepository
from app.repositories.risk_repository import RiskRepository
from app.repositories.statistics_repository import RiskStatisticsRepository, MitigationStatisticsRepository
from app.services.analytics_service import AnalyticsService
from app.services.dashboard_service import DashboardService


REFERENCE_DATE = date(2030, 5, 1)


@pytest.fixture
def statistics_data(db_session, user_factory):
    user = user_factory("ADMIN")
    categories = [RiskCategory(name="Alfa análisis"), RiskCategory(name="Beta análisis")]
    db_session.add_all(categories)
    db_session.flush()
    cases = [
        ("Repetido", 0, "IDENTIFIED", "LOW", 1, 1, datetime(2030, 1, 10)),
        ("Repetido", 0, "ASSESSED", "MEDIUM", 2, 3, datetime(2030, 4, 10)),
        ("Repetido", 0, "MITIGATION_IN_PROGRESS", "HIGH", 3, 4, datetime(2030, 4, 11)),
        ("Diferente", 1, "CLOSED", "CRITICAL", 5, 4, datetime(2030, 2, 10)),
        ("Sin evaluar", 1, "MONITORED", None, None, None, datetime(2030, 2, 11)),
    ]
    risks = []
    for title, category, status, level, probability, impact, created_at in cases:
        risk = Risk(
            title=title, category_id=categories[category].id, created_by=user.id,
            status=status, risk_level=level, probability=probability, impact=impact,
            risk_score=probability * impact if probability and impact else None, created_at=created_at,
        )
        db_session.add(risk)
        risks.append(risk)
    db_session.flush()
    plans = []
    for title, status, offset in [("Vencido", "PLANNED", -1), ("Manual", "OVERDUE", 10), ("Resuelto", "COMPLETED", -1)]:
        plan = MitigationPlan(
            risk_id=risks[0].id, responsible_user_id=user.id, title=title, status=status,
            start_date=REFERENCE_DATE - timedelta(days=20), due_date=REFERENCE_DATE + timedelta(days=offset),
            progress=100 if status == "COMPLETED" else 0,
        )
        db_session.add(plan)
        plans.append(plan)
    db_session.commit()
    return {
        "user_id": user.id, "category_ids": [category.id for category in categories],
        "risk_ids": [risk.id for risk in risks], "plan_ids": [plan.id for plan in plans],
    }


def reject_entity_scan(*args, **kwargs):
    raise AssertionError("Statistics must not scan ORM entities through list_all/list_overdue")


def test_dashboard_aggregate_results_preserve_counts_order_and_matrix_ids(db_session, statistics_data):
    service = DashboardService(db_session)
    assert service.get_summary(REFERENCE_DATE).model_dump() == {
        "total_risks": 5, "critical_risks": 1, "high_risks": 1, "medium_risks": 1, "low_risks": 1,
        "open_risks": 4, "closed_risks": 1, "active_mitigation_plans": 2, "overdue_mitigation_plans": 2,
    }
    assert [(point.label, point.value) for point in service.get_risks_by_level()] == [("LOW", 1), ("MEDIUM", 1), ("HIGH", 1), ("CRITICAL", 1)]
    assert [(point.label, point.value) for point in service.get_risks_by_category()] == [("Alfa análisis", 3), ("Beta análisis", 2)]
    assert [(point.label, point.value) for point in service.get_risks_by_status()] == [
        ("IDENTIFIED", 1), ("ASSESSED", 1), ("MITIGATION_IN_PROGRESS", 1), ("MONITORED", 1), ("CLOSED", 1),
    ]
    assert [(point.label, point.value) for point in service.get_risk_trend()] == [("2030-01", 1), ("2030-02", 2), ("2030-04", 2)]
    matrix = service.get_risk_matrix()
    assert len(matrix) == 25
    expected = dict(zip([(1, 1), (2, 3), (3, 4), (5, 4)], statistics_data["risk_ids"][:4]))
    for cell in matrix:
        expected_id = expected.get((cell.probability, cell.impact))
        assert cell.risk_ids == ([expected_id] if expected_id else [])
        assert cell.count == len(cell.risk_ids)
    assert statistics_data["risk_ids"][4] not in [risk_id for cell in matrix for risk_id in cell.risk_ids]


def test_empty_aggregates_keep_existing_json_shapes_and_zero_buckets(db_session):
    dashboard = DashboardService(db_session)
    assert all(value == 0 for value in dashboard.get_summary(REFERENCE_DATE).model_dump().values())
    assert len(dashboard.get_risks_by_level()) == 4
    assert len(dashboard.get_risks_by_status()) == 5
    assert len(dashboard.get_mitigations_by_status(REFERENCE_DATE)) == 5
    assert all(point.value == 0 for point in dashboard.get_risks_by_level() + dashboard.get_risks_by_status() + dashboard.get_mitigations_by_status(REFERENCE_DATE))
    assert dashboard.get_risks_by_category() == dashboard.get_risk_trend() == []
    assert len(dashboard.get_risk_matrix()) == 25
    assert AnalyticsService(db_session).build_analytics(REFERENCE_DATE).model_dump() == {
        "top_categories": [], "recurring_risks": [], "trending_risks": [], "overdue_mitigations": [], "recommendations": [],
    }


def test_analytics_preserves_latest_two_observed_months_and_stored_overdue_status(db_session, statistics_data):
    analytics = AnalyticsService(db_session).build_analytics(REFERENCE_DATE)
    assert analytics.top_categories == [{"category": "Alfa análisis", "count": 3}, {"category": "Beta análisis", "count": 2}]
    assert analytics.recurring_risks == [{"title": "Repetido", "count": 3}]
    # January and April are the latest observed months; missing months stay absent.
    assert analytics.trending_risks == [{"category": "Alfa análisis", "current_count": 2, "previous_count": 1}]
    assert [item["id"] for item in analytics.overdue_mitigations] == statistics_data["plan_ids"][:2]
    assert [item["status"] for item in analytics.overdue_mitigations] == ["PLANNED", "OVERDUE"]
    assert all(set(item) == {"id", "title", "due_date", "status"} for item in analytics.overdue_mitigations)
    assert {item.type for item in analytics.recommendations} == {"TOP_CATEGORY", "RECURRING_RISK", "OVERDUE_MITIGATION", "TRENDING_CATEGORY"}


def test_recurring_titles_remain_case_and_trailing_space_sensitive(db_session, user_factory):
    user = user_factory("ADMIN")
    category_id = db_session.scalar(select(RiskCategory.id).order_by(RiskCategory.id))
    for title in ["Caso", "caso", "Caso "]:
        db_session.add_all([Risk(title=title, category_id=category_id, created_by=user.id) for _ in range(2)])
    db_session.add(Risk(title="Caso  ", category_id=category_id, created_by=user.id))
    db_session.commit()
    assert RiskStatisticsRepository(db_session).recurring_titles() == [
        {"title": "Caso", "count": 2}, {"title": "Caso ", "count": 2}, {"title": "caso", "count": 2},
    ]


def test_summary_and_graphs_keep_exact_status_and_level_codes(db_session, user_factory):
    user = user_factory("ADMIN")
    category_id = db_session.scalar(select(RiskCategory.id).order_by(RiskCategory.id))
    risks = []
    for level, status in [("CRITICAL", "CLOSED"), ("critical", "closed"), ("CRITICAL ", "CLOSED ")]:
        risk = Risk(title="Variantes guardadas", category_id=category_id, created_by=user.id,
                    risk_level=level, status=status)
        db_session.add(risk)
        risks.append(risk)
    db_session.flush()
    for status in ("PLANNED", "planned", "PLANNED "):
        db_session.add(MitigationPlan(
            title="Variantes de plan", risk_id=risks[0].id, responsible_user_id=user.id,
            start_date=REFERENCE_DATE, due_date=REFERENCE_DATE + timedelta(days=1), status=status,
        ))
    db_session.commit()

    dashboard = DashboardService(db_session)
    summary = dashboard.get_summary(REFERENCE_DATE)
    assert summary.total_risks == 3
    assert summary.critical_risks == summary.closed_risks == 1
    assert summary.open_risks == 2
    assert summary.active_mitigation_plans == 1
    assert {point.label: point.value for point in dashboard.get_risks_by_level()}["CRITICAL"] == 1
    assert {point.label: point.value for point in dashboard.get_risks_by_status()}["CLOSED"] == 1
    assert {point.label: point.value for point in dashboard.get_mitigations_by_status(REFERENCE_DATE)}["PLANNED"] == 1


@pytest.mark.parametrize("risk_count", [0, 200])
def test_statistics_query_budgets_do_not_grow_with_risk_count(db_session, statistics_data, monkeypatch, risk_count):
    db_session.add_all([
        Risk(title=f"Adicional {index}", category_id=statistics_data["category_ids"][index % 2], created_by=statistics_data["user_id"])
        for index in range(risk_count)
    ])
    db_session.commit()
    monkeypatch.setattr(RiskRepository, "list_all", reject_entity_scan)
    monkeypatch.setattr(MitigationPlanRepository, "list_all", reject_entity_scan)
    monkeypatch.setattr(MitigationPlanRepository, "list_overdue", reject_entity_scan)
    statements = []

    def capture(connection, cursor, statement, parameters, context, executemany):
        if statement.lstrip().upper().startswith("SELECT"):
            statements.append(statement)

    bind = db_session.get_bind()
    event.listen(bind, "before_cursor_execute", capture)
    try:
        dashboard = DashboardService(db_session)
        operations = [
            (lambda: dashboard.get_summary(REFERENCE_DATE), 2),
            (dashboard.get_risks_by_level, 1), (dashboard.get_risks_by_category, 1),
            (dashboard.get_risks_by_status, 1), (dashboard.get_risk_trend, 1),
            (lambda: dashboard.get_mitigations_by_status(REFERENCE_DATE), 1),
            (dashboard.get_risk_matrix, 1),
            (lambda: AnalyticsService(db_session).build_analytics(REFERENCE_DATE), 4),
        ]
        for operation, expected_queries in operations:
            statements.clear()
            identity_count = len(db_session.identity_map)
            operation()
            assert len(statements) == expected_queries
            assert len(db_session.identity_map) == identity_count
            assert not any("JOIN users" in statement for statement in statements)
        statements.clear()
        dashboard.get_risk_matrix()
        assert "risks.description" not in statements[0]
        assert "risks.title" not in statements[0]
        assert "risks.risk_score" not in statements[0]
    finally:
        event.remove(bind, "before_cursor_execute", capture)


def test_empty_analytics_stops_after_one_aggregate_query(db_session):
    statements = []

    def capture(connection, cursor, statement, parameters, context, executemany):
        if statement.lstrip().upper().startswith("SELECT"):
            statements.append(statement)

    bind = db_session.get_bind()
    event.listen(bind, "before_cursor_execute", capture)
    try:
        AnalyticsService(db_session).build_analytics(REFERENCE_DATE)
    finally:
        event.remove(bind, "before_cursor_execute", capture)
    assert len(statements) == 1


@pytest.mark.parametrize("repository_class,method,args,requires_exact,requires_month", [
    (RiskStatisticsRepository, "summary_counts", (), True, False),
    (RiskStatisticsRepository, "counts_by_level", (), True, False),
    (RiskStatisticsRepository, "counts_by_status", (), True, False),
    (RiskStatisticsRepository, "counts_by_category", (), True, False),
    (RiskStatisticsRepository, "counts_by_month", (), False, True),
    (RiskStatisticsRepository, "recurring_titles", (), True, False),
    (RiskStatisticsRepository, "counts_by_category_month", (), True, True),
    (RiskStatisticsRepository, "matrix_coordinates", (), False, False),
    (MitigationStatisticsRepository, "summary_counts", (REFERENCE_DATE,), True, False),
    (MitigationStatisticsRepository, "counts_by_effective_status", (REFERENCE_DATE,), True, False),
    (MitigationStatisticsRepository, "overdue_projection", (REFERENCE_DATE,), False, False),
])
def test_statistics_statements_compile_for_sql_server(repository_class, method, args, requires_exact, requires_month):
    class CapturedStatement(Exception):
        pass

    statements = []

    def capture(statement):
        statements.append(statement)
        raise CapturedStatement

    dialect = mssql.dialect()
    session = SimpleNamespace(get_bind=lambda: SimpleNamespace(dialect=dialect), execute=capture)
    with pytest.raises(CapturedStatement):
        getattr(repository_class(session), method)(*args)
    sql = str(statements[0].compile(dialect=dialect)).lower()
    assert "strftime" not in sql
    assert "select" in sql
    if requires_exact:
        assert "collate latin1_general_100_bin2" in sql
        assert "datalength" in sql
    if requires_month:
        assert "datepart(year," in sql and "datepart(month," in sql
