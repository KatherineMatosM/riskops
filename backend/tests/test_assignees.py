from types import SimpleNamespace

import pytest
from sqlalchemy.dialects import mssql

from app.repositories.user_repository import UserRepository


@pytest.mark.parametrize("role", ["ADMIN", "RISK_MANAGER", "ANALYST"])
def test_authorized_roles_can_read_only_active_minimal_assignees(client, user_factory, headers_for, role):
    actor = user_factory(role, full_name="Usuario actor")
    actor_id = actor.id
    headers = headers_for(actor)
    first = user_factory("VIEWER", full_name="Ana disponible")
    first_id = first.id
    last = user_factory("ANALYST", full_name="Zoe disponible")
    last_id = last.id
    inactive = user_factory("VIEWER", full_name="Cuenta inactiva", is_active=False)
    inactive_id = inactive.id

    response = client.get("/api/v1/users/assignees", headers=headers)

    assert response.status_code == 200
    assert response.json()["success"] is True
    options = response.json()["data"]
    assert all(set(option) == {"id", "full_name"} for option in options)
    assert [option["id"] for option in options] == [first_id, actor_id, last_id]
    assert inactive_id not in {option["id"] for option in options}
    assert "password_hash" not in response.text
    assert "@example.com" not in response.text


def test_viewer_cannot_read_assignees(client, viewer_headers):
    response = client.get("/api/v1/users/assignees", headers=viewer_headers)

    assert response.status_code == 403
    assert response.json()["error_code"] == "FORBIDDEN_ROLE"


def test_assignees_still_require_authentication(client):
    assert client.get("/api/v1/users/assignees").status_code == 401


def test_analyst_assignees_access_does_not_expose_user_directory(client, user_factory, headers_for):
    analyst = user_factory("ANALYST")
    analyst_id = analyst.id
    headers = headers_for(analyst)

    assert client.get("/api/v1/users/assignees", headers=headers).status_code == 200
    assert client.get("/api/v1/users", headers=headers).status_code == 403
    assert client.get(f"/api/v1/users/{analyst_id}", headers=headers).status_code == 403
    assert client.post("/api/v1/users", headers=headers, json={
        "full_name": "No autorizado", "email": "new@example.com", "password": "Password123",
    }).status_code == 403


def test_assignee_projection_is_minimal_and_sql_server_boolean_is_portable():
    statements = []

    class CapturedStatement(Exception):
        pass

    def capture(statement):
        statements.append(statement)
        raise CapturedStatement

    with pytest.raises(CapturedStatement):
        UserRepository(SimpleNamespace(execute=capture)).list_assignees()

    statement = statements[0]
    assert list(statement.selected_columns.keys()) == ["id", "full_name"]
    sql = str(statement.compile(dialect=mssql.dialect())).lower()
    assert "users.is_active = 1" in sql
    assert "users.is_active is 1" not in sql
    assert "users.password_hash" not in sql
    assert "users.email" not in sql
