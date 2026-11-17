from datetime import datetime

import pytest
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.risk_category import RiskCategory
from app.models.user import User
from app.models.user_role import UserRole
from app.repositories.risk_category_repository import RiskCategoryRepository
from app.repositories.user_repository import UserRepository
from app.services import mitigation_action_service


@pytest.fixture
def crud_records(client, user_factory, headers_for):
    admin = user_factory("ADMIN")
    admin_id = admin.id
    headers = headers_for(admin)
    category = client.post("/api/v1/risk-categories", headers=headers, json={
        "name": "Categoria editable", "description": "Descripción original",
    })
    assert category.status_code == 200
    category_id = category.json()["data"]["id"]
    risk = client.post("/api/v1/risks", headers=headers, json={
        "title": "Riesgo de regresión", "category_id": category_id, "probability": 1, "impact": 1,
    })
    assert risk.status_code == 200
    risk_id = risk.json()["data"]["id"]
    plan = client.post(f"/api/v1/risks/{risk_id}/mitigation-plans", headers=headers, json={
        "title": "Plan de regresión", "responsible_user_id": admin_id,
        "start_date": "2031-02-01", "due_date": "2031-02-10",
    })
    assert plan.status_code == 200
    plan_id = plan.json()["data"]["id"]
    action = client.post(f"/api/v1/mitigation-plans/{plan_id}/actions", headers=headers, json={
        "title": "Acción de regresión", "responsible_user_id": admin_id, "due_date": "2031-02-05",
    })
    assert action.status_code == 200
    return {
        "headers": headers, "admin_id": admin_id, "category_id": category_id, "risk_id": risk_id,
        "action_id": action.json()["data"]["id"],
    }


def assert_field_422(response, field):
    assert response.status_code == 422
    errors = {error["field"]: error for error in response.json()["errors"]}
    assert errors[field]["location"] == ["body", field]
    return errors[field]


@pytest.mark.parametrize("target,field,value", [
    ("profile", "full_name", "n"),
    ("profile", "full_name", "n" * 151),
    ("user", "full_name", "n"),
    ("user", "full_name", "n" * 151),
    ("category_create", "description", "d" * 256),
    ("category_update", "description", "d" * 256),
    ("category_update", "name", "n"),
    ("category_update", "name", "n" * 101),
    ("category_update", "status", "s" * 21),
    ("evaluation", "observations", "o" * 1001),
])
def test_request_lengths_match_database_columns(client, crud_records, target, field, value):
    paths = {
        "profile": ("PUT", "/api/v1/users/me/profile", {}),
        "user": ("PUT", f"/api/v1/users/{crud_records['admin_id']}", {}),
        "category_create": ("POST", "/api/v1/risk-categories", {"name": "Categoria nueva"}),
        "category_update": ("PUT", f"/api/v1/risk-categories/{crud_records['category_id']}", {}),
        "evaluation": ("POST", f"/api/v1/risks/{crud_records['risk_id']}/evaluations", {"probability": 1, "impact": 1}),
    }
    method, path, payload = paths[target]
    response = client.request(method, path, headers=crud_records["headers"], json={**payload, field: value})

    assert_field_422(response, field)


@pytest.mark.parametrize("path", ["/api/v1/auth/register", "/api/v1/users"])
def test_user_email_cannot_exceed_its_database_column(client, admin_headers, path):
    email = "a" * 64 + "@" + "b" * 50 + "." + "c" * 31 + ".com"
    assert len(email) == 151
    response = client.post(path, headers=admin_headers, json={
        "full_name": "Usuario de prueba", "email": email, "password": "Password123",
    })

    assert_field_422(response, "email")


def test_exact_database_text_limits_still_succeed(client, crud_records):
    headers = crud_records["headers"]
    profile = client.put("/api/v1/users/me/profile", headers=headers, json={"full_name": "n" * 150})
    assert profile.status_code == 200
    assert len(profile.json()["data"]["full_name"]) == 150
    category = client.put(f"/api/v1/risk-categories/{crud_records['category_id']}", headers=headers, json={
        "name": "c" * 100, "description": "d" * 255,
    })
    assert category.status_code == 200
    assert len(category.json()["data"]["description"]) == 255
    evaluation = client.post(f"/api/v1/risks/{crud_records['risk_id']}/evaluations", headers=headers, json={
        "probability": 1, "impact": 1, "observations": "o" * 1000,
    })
    assert evaluation.status_code == 200
    assert len(evaluation.json()["data"]["observations"]) == 1000


@pytest.mark.parametrize("miss_precheck", [False, True])
def test_duplicate_category_rename_is_409_and_rolls_back(client, crud_records, db_session, monkeypatch, miss_precheck):
    response = client.post("/api/v1/risk-categories", headers=crud_records["headers"], json={"name": "Categoria ocupada"})
    assert response.status_code == 200
    if miss_precheck:
        # Simulate a concurrent insert after the preliminary check; the real unique constraint still runs.
        monkeypatch.setattr(RiskCategoryRepository, "get_by_name", lambda self, name: None)
    response = client.put(f"/api/v1/risk-categories/{crud_records['category_id']}", headers=crud_records["headers"], json={
        "name": "Categoria ocupada", "description": "No debe guardarse",
    })

    assert response.status_code == 409
    assert response.json()["error_code"] == "CATEGORY_ALREADY_EXISTS"
    assert "UNIQUE constraint" not in response.text
    with Session(db_session.get_bind()) as stored:
        category = stored.get(RiskCategory, crud_records["category_id"])
        assert category.name == "Categoria editable"
        assert category.description == "Descripción original"


def test_duplicate_category_create_is_409_even_after_a_missed_precheck(client, crud_records, db_session, monkeypatch):
    monkeypatch.setattr(RiskCategoryRepository, "get_by_name", lambda self, name: None)
    response = client.post("/api/v1/risk-categories", headers=crud_records["headers"], json={"name": "Categoria editable"})

    assert response.status_code == 409
    assert response.json()["error_code"] == "CATEGORY_ALREADY_EXISTS"
    with Session(db_session.get_bind()) as stored:
        assert len(stored.scalars(select(RiskCategory).where(RiskCategory.name == "Categoria editable")).all()) == 1


def test_category_keeps_omitted_description_and_clears_explicit_null(client, crud_records):
    path = f"/api/v1/risk-categories/{crud_records['category_id']}"
    response = client.put(path, headers=crud_records["headers"], json={"name": "Categoria editable"})
    assert response.status_code == 200
    assert response.json()["data"]["description"] == "Descripción original"
    response = client.put(path, headers=crud_records["headers"], json={"description": None})
    assert response.status_code == 200
    assert response.json()["data"]["description"] is None
    assert client.get(path, headers=crud_records["headers"]).json()["data"]["description"] is None


def test_completed_action_put_preserves_its_original_completion_time(client, crud_records, monkeypatch):
    class Clock:
        value = datetime(2032, 1, 1, 12)

        @classmethod
        def utcnow(cls):
            return cls.value

    monkeypatch.setattr(mitigation_action_service, "datetime", Clock)
    path = f"/api/v1/mitigation-actions/{crud_records['action_id']}"
    first = client.put(path, headers=crud_records["headers"], json={"status": "COMPLETED"})
    assert first.status_code == 200
    original_completed_at = first.json()["data"]["completed_at"]
    assert original_completed_at == Clock.value.isoformat()

    Clock.value = datetime(2032, 1, 2, 12)
    repeated = client.put(path, headers=crud_records["headers"], json={"status": "COMPLETED"})
    assert repeated.status_code == 200
    assert repeated.json()["data"]["completed_at"] == original_completed_at

    # Keep the existing permitted transitions and timestamp policy when leaving COMPLETED.
    reopened = client.put(path, headers=crud_records["headers"], json={"status": "IN_PROGRESS"})
    assert reopened.status_code == 200
    assert reopened.json()["data"]["completed_at"] == original_completed_at
    completed_again = client.put(path, headers=crud_records["headers"], json={"status": "COMPLETED"})
    assert completed_again.status_code == 200
    assert completed_again.json()["data"]["completed_at"] == Clock.value.isoformat()


def test_referenced_category_delete_is_409_and_preserves_its_risk(client, crud_records):
    path = f"/api/v1/risk-categories/{crud_records['category_id']}"
    response = client.delete(path, headers=crud_records["headers"])

    assert response.status_code == 409
    assert response.json()["error_code"] == "CAT_IN_USE"
    assert client.get(path, headers=crud_records["headers"]).status_code == 200
    risk = client.get(f"/api/v1/risks/{crud_records['risk_id']}", headers=crud_records["headers"])
    assert risk.status_code == 200
    assert risk.json()["data"]["category_id"] == crud_records["category_id"]


def test_referenced_user_delete_is_409_and_restores_roles_after_fk_failure(client, crud_records, db_session, monkeypatch):
    def blocked_delete(self, user):
        # SQL Server can reject the user DELETE after the ORM has deleted its role links.
        self.db.query(UserRole).filter(UserRole.user_id == user.id).delete()
        self.db.flush()
        raise IntegrityError("DELETE users", {}, RuntimeError("private-foreign-key-details"))

    monkeypatch.setattr(UserRepository, "delete", blocked_delete)
    response = client.delete(f"/api/v1/users/{crud_records['admin_id']}", headers=crud_records["headers"])

    assert response.status_code == 409
    assert response.json()["error_code"] == "USER_IN_USE"
    assert "private-foreign-key-details" not in response.text
    with Session(db_session.get_bind()) as stored:
        user = stored.get(User, crud_records["admin_id"])
        assert user is not None
        assert UserRepository(stored).get_role_names(user.id) == ["ADMIN"]
        email = user.email
    assert client.get("/api/v1/auth/me", headers=crud_records["headers"]).status_code == 200
    login = client.post("/api/v1/auth/login", json={"email": email, "password": "Password123"})
    assert login.status_code == 200
    assert login.json()["data"]["user"]["roles"] == ["ADMIN"]


def test_unreferenced_category_can_still_be_deleted(client, crud_records):
    created = client.post("/api/v1/risk-categories", headers=crud_records["headers"], json={"name": "Categoria libre"})
    assert created.status_code == 200
    path = f"/api/v1/risk-categories/{created.json()['data']['id']}"
    assert client.delete(path, headers=crud_records["headers"]).status_code == 200
    assert client.get(path, headers=crud_records["headers"]).status_code == 404


def test_unreferenced_user_can_still_be_deleted(client, crud_records, user_factory):
    user_id = user_factory("VIEWER").id
    path = f"/api/v1/users/{user_id}"
    assert client.delete(path, headers=crud_records["headers"]).status_code == 200
    assert client.get(path, headers=crud_records["headers"]).status_code == 404
