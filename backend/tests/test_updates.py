from copy import deepcopy

import pytest
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.mitigation_action import MitigationAction
from app.models.mitigation_plan import MitigationPlan
from app.models.notification import Notification
from app.models.risk import Risk
from app.models.risk_evaluation import RiskEvaluation
from app.models.risk_history import RiskHistory
from app.repositories.notification_repository import NotificationRepository
from app.schemas.risk_schema import RiskUpdateRequest
from app.services.risk_service import RiskService


MODELS = {"risk": Risk, "plan": MitigationPlan, "action": MitigationAction}


@pytest.fixture
def records(client, user_factory, headers_for):
    actor = user_factory("ANALYST")
    actor_id = actor.id
    headers = headers_for(actor)
    category_id = client.get("/api/v1/risk-categories", headers=headers).json()["data"][0]["id"]
    payloads = {
        "risk": {"title": "Riesgo original", "description": "Descripción original", "category_id": category_id,
                 "responsible_user_id": actor_id, "probability": 2, "impact": 3},
        "plan": {"title": "Plan original", "description": "Descripción original", "responsible_user_id": actor_id,
                 "start_date": "2031-02-01", "due_date": "2031-02-10"},
        "action": {"title": "Acción original", "description": "Descripción original", "responsible_user_id": actor_id,
                   "due_date": "2031-02-05"},
    }
    create_paths = {"risk": "/api/v1/risks"}
    risk = client.post(create_paths["risk"], headers=headers, json=payloads["risk"])
    assert risk.status_code == 200
    risk_id = risk.json()["data"]["id"]
    create_paths["plan"] = f"/api/v1/risks/{risk_id}/mitigation-plans"
    plan = client.post(create_paths["plan"], headers=headers, json=payloads["plan"])
    assert plan.status_code == 200
    plan_id = plan.json()["data"]["id"]
    create_paths["action"] = f"/api/v1/mitigation-plans/{plan_id}/actions"
    action = client.post(create_paths["action"], headers=headers, json=payloads["action"])
    assert action.status_code == 200
    action_id = action.json()["data"]["id"]
    return {
        "headers": headers, "actor_id": actor_id, "category_id": category_id,
        "ids": {"risk": risk_id, "plan": plan_id, "action": action_id},
        "create": create_paths, "payloads": payloads,
        "update": {"risk": f"/api/v1/risks/{risk_id}", "plan": f"/api/v1/mitigation-plans/{plan_id}",
                   "action": f"/api/v1/mitigation-actions/{action_id}"},
    }


def field_errors(response):
    assert response.status_code == 422
    body = response.json()
    assert body["success"] is False
    assert body["errors"]
    for error in body["errors"]:
        assert set(error) == {"field", "location", "message", "type"}
        assert error["location"] == ["body", error["field"]]
    return {error["field"]: error for error in body["errors"]}


def assessment_counts(db_session):
    with Session(db_session.get_bind()) as stored:
        return (
            stored.scalar(select(func.count()).select_from(RiskEvaluation)),
            stored.scalar(select(func.count()).select_from(RiskHistory).where(RiskHistory.action == "EVALUATED")),
            stored.scalar(select(func.count()).select_from(Notification).where(Notification.type == "RISK_CRITICAL")),
        )


def test_changed_axes_recalculate_once_and_critical_alerts_only_on_transition(client, records, db_session):
    response = client.put(records["update"]["risk"], headers=records["headers"], json={"probability": 5, "impact": 5})
    assert response.status_code == 200
    result = response.json()["data"]
    assert (result["probability"], result["impact"], result["risk_score"], result["risk_level"]) == (5, 5, 25, "CRITICAL")
    assert result["status"] == "MITIGATION_IN_PROGRESS"
    assert assessment_counts(db_session) == (1, 1, 1)

    response = client.put(records["update"]["risk"], headers=records["headers"], json={"probability": 4, "impact": 5})
    assert response.status_code == 200
    assert response.json()["data"]["risk_score"] == 20
    assert assessment_counts(db_session) == (2, 2, 1)

    response = client.put(records["update"]["risk"], headers=records["headers"], json={"title": "Título actualizado", "probability": 4, "impact": 5})
    assert response.status_code == 200
    assert assessment_counts(db_session) == (2, 2, 1)


@pytest.mark.parametrize("axes", [{}, {"probability": 2, "impact": 3}, {"probability": None, "impact": None}])
def test_title_only_unchanged_or_null_axes_do_not_create_assessments(client, records, db_session, axes):
    response = client.put(records["update"]["risk"], headers=records["headers"], json={"title": "Solo cambia el título", **axes})
    assert response.status_code == 200
    result = response.json()["data"]
    assert (result["probability"], result["impact"], result["risk_score"]) == (2, 3, 6)
    assert assessment_counts(db_session) == (0, 0, 0)


def test_partial_nonnull_axis_merges_the_stored_counterpart(client, records, db_session):
    response = client.put(records["update"]["risk"], headers=records["headers"], json={"probability": 4})
    assert response.status_code == 200
    result = response.json()["data"]
    assert (result["probability"], result["impact"], result["risk_score"], result["risk_level"]) == (4, 3, 12, "HIGH")
    assert assessment_counts(db_session) == (1, 1, 0)


@pytest.mark.parametrize("status", ["ASSESSED", "MITIGATION_IN_PROGRESS", "MONITORED", "CLOSED"])
def test_new_assessment_preserves_explicit_workflow_status(client, records, status):
    response = client.put(records["update"]["risk"], headers=records["headers"], json={"status": status, "probability": 5, "impact": 5})
    assert response.status_code == 200
    assert response.json()["data"]["status"] == status


@pytest.mark.parametrize("axis,missing", [("probability", "impact"), ("impact", "probability")])
def test_incomplete_initial_pair_is_rejected_with_the_missing_field(client, records, axis, missing):
    response = client.post(records["create"]["risk"], headers=records["headers"], json={
        "title": "Evaluación incompleta", "category_id": records["category_id"], axis: 3,
    })
    assert field_errors(response)[missing]["type"] == "missing_counterpart"


def test_unassessed_risk_null_edits_missing_counterpart_and_first_assessment(client, records, db_session):
    response = client.post(records["create"]["risk"], headers=records["headers"], json={
        "title": "Riesgo sin evaluar", "category_id": records["category_id"], "probability": None, "impact": None,
    })
    assert response.status_code == 200
    path = f"/api/v1/risks/{response.json()['data']['id']}"
    response = client.put(path, headers=records["headers"], json={"title": "Información actualizada", "probability": None, "impact": None})
    assert response.status_code == 200
    assert response.json()["data"]["status"] == "IDENTIFIED"
    assert response.json()["data"]["risk_score"] is None
    assert assessment_counts(db_session) == (0, 0, 0)

    response = client.put(path, headers=records["headers"], json={"probability": 4})
    assert field_errors(response)["impact"]["type"] == "missing_counterpart"
    response = client.put(path, headers=records["headers"], json={"probability": 2, "impact": 3})
    assert response.status_code == 200
    assert response.json()["data"]["status"] == "ASSESSED"
    assert assessment_counts(db_session) == (1, 1, 0)


def test_nested_evaluation_failure_rolls_back_other_risk_updates(records, db_session, monkeypatch):
    original = NotificationRepository.create

    def fail_after_write(self, notification):
        original(self, notification)
        raise RuntimeError("Injected notification failure")

    monkeypatch.setattr(NotificationRepository, "create", fail_after_write)
    with pytest.raises(RuntimeError, match="Injected"):
        RiskService(db_session).update_risk(
            records["ids"]["risk"],
            RiskUpdateRequest(title="Este cambio debe revertirse", probability=5, impact=5),
            records["actor_id"],
        )
    with Session(db_session.get_bind()) as stored:
        risk = stored.get(Risk, records["ids"]["risk"])
        assert risk.title == "Riesgo original"
        assert (risk.probability, risk.impact, risk.risk_score) == (2, 3, 6)
    assert assessment_counts(db_session) == (0, 0, 0)


@pytest.mark.parametrize("kind", MODELS)
def test_update_omission_preserves_nullable_fields_and_null_clears_description(client, records, db_session, kind):
    response = client.put(records["update"][kind], headers=records["headers"], json={"title": "Título actualizado"})
    assert response.status_code == 200
    result = response.json()["data"]
    assert result["description"] == "Descripción original"
    assert result["responsible_user_id"] == records["actor_id"]
    response = client.put(records["update"][kind], headers=records["headers"], json={"description": None})
    assert response.status_code == 200
    assert response.json()["data"]["description"] is None
    with Session(db_session.get_bind()) as stored:
        assert stored.get(MODELS[kind], records["ids"][kind]).description is None


def test_risk_responsible_can_be_cleared_with_audit_without_notification(client, records, db_session):
    response = client.put(records["update"]["risk"], headers=records["headers"], json={"responsible_user_id": None})
    assert response.status_code == 200
    assert response.json()["data"]["responsible_user_id"] is None
    with Session(db_session.get_bind()) as stored:
        history = stored.scalar(select(RiskHistory).where(RiskHistory.action == "RESPONSIBLE_CHANGED"))
        assert history.old_value == str(records["actor_id"])
        assert history.new_value is None
        assert stored.scalar(select(func.count()).select_from(Notification)) == 0


@pytest.mark.parametrize("kind", MODELS)
@pytest.mark.parametrize("operation", ["create", "update"])
def test_missing_responsible_is_a_field_422_and_leaves_data_unchanged(client, records, db_session, kind, operation):
    payload = deepcopy(records["payloads"][kind]) if operation == "create" else {"title": "No debe guardarse"}
    payload["responsible_user_id"] = 999999
    method = client.post if operation == "create" else client.put
    response = method(records[operation][kind], headers=records["headers"], json=payload)
    assert field_errors(response)["responsible_user_id"]["type"] == "invalid_reference"
    with Session(db_session.get_bind()) as stored:
        assert stored.scalar(select(func.count()).select_from(MODELS[kind])) == 1
        assert stored.get(MODELS[kind], records["ids"][kind]).title == records["payloads"][kind]["title"]


@pytest.mark.parametrize("kind", MODELS)
@pytest.mark.parametrize("operation", ["create", "update"])
@pytest.mark.parametrize("field,value,error_type", [
    ("title", "ab", "string_too_short"),
    ("title", "x" * 201, "string_too_long"),
    ("description", "x" * 2001, "string_too_long"),
    ("unexpected_field", "private-untrusted-input", "extra_forbidden"),
])
def test_input_contract_limits_and_unknown_fields(client, records, kind, operation, field, value, error_type):
    payload = deepcopy(records["payloads"][kind]) if operation == "create" else {}
    payload[field] = value
    method = client.post if operation == "create" else client.put
    response = method(records[operation][kind], headers=records["headers"], json=payload)
    assert field_errors(response)[field]["type"] == error_type
    assert "private-untrusted-input" not in response.text


@pytest.mark.parametrize("kind", MODELS)
def test_update_accepts_full_title_and_description_lengths(client, records, kind):
    response = client.put(records["update"][kind], headers=records["headers"], json={"title": "t" * 200, "description": "d" * 2000})
    assert response.status_code == 200
    assert len(response.json()["data"]["title"]) == 200
    assert len(response.json()["data"]["description"]) == 2000


@pytest.mark.parametrize("kind,field", [
    ("risk", "title"), ("risk", "category_id"), ("risk", "status"),
    ("plan", "title"), ("plan", "responsible_user_id"), ("plan", "start_date"),
    ("plan", "due_date"), ("plan", "status"), ("plan", "progress"),
    ("action", "title"), ("action", "responsible_user_id"), ("action", "due_date"), ("action", "status"),
])
def test_update_rejects_explicit_null_for_nonnullable_fields(client, records, kind, field):
    response = client.put(records["update"][kind], headers=records["headers"], json={field: None})
    error = field_errors(response)[field]
    assert error["type"] == "null_not_allowed"
    assert error["message"] == "Este campo no admite valores nulos."


@pytest.mark.parametrize("axes", [{"probability": 0}, {"probability": 6}, {"impact": 0}, {"impact": 6}])
def test_update_axes_remain_on_the_one_to_five_scale(client, records, axes):
    response = client.put(records["update"]["risk"], headers=records["headers"], json=axes)
    assert set(field_errors(response)) == set(axes)


def test_create_plan_date_order_has_a_safe_field_error(client, records):
    payload = {**records["payloads"]["plan"], "start_date": "2031-03-01", "due_date": "2031-02-01"}
    response = client.post(records["create"]["plan"], headers=records["headers"], json=payload)
    error = field_errors(response)["due_date"]
    assert error["type"] == "date_order"
    assert error["message"] == "La fecha límite debe ser igual o posterior a la fecha de inicio."


@pytest.mark.parametrize("dates,field", [
    ({"start_date": "2031-02-11"}, "start_date"),
    ({"due_date": "2031-01-31"}, "due_date"),
    ({"start_date": "2031-03-01", "due_date": "2031-02-01"}, "due_date"),
])
def test_update_plan_validates_final_merged_dates_and_rolls_back(client, records, db_session, dates, field):
    response = client.put(records["update"]["plan"], headers=records["headers"], json={"title": "No debe guardarse", **dates})
    assert field_errors(response)[field]["type"] == "date_order"
    with Session(db_session.get_bind()) as stored:
        plan = stored.get(MitigationPlan, records["ids"]["plan"])
        assert plan.title == "Plan original"
        assert plan.start_date.isoformat() == "2031-02-01"
        assert plan.due_date.isoformat() == "2031-02-10"


def test_equal_plan_dates_and_existing_completion_behavior_remain_valid(client, records):
    response = client.put(records["update"]["plan"], headers=records["headers"], json={"start_date": "2031-02-10"})
    assert response.status_code == 200
    assert response.json()["data"]["start_date"] == response.json()["data"]["due_date"]
    response = client.put(records["update"]["plan"], headers=records["headers"], json={"progress": 100})
    assert response.status_code == 200
    assert response.json()["data"]["status"] == "COMPLETED"
    assert response.json()["data"]["progress"] == 100
