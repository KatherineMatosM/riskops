from datetime import date, datetime, timedelta, timezone
import re

import jwt
import pytest
from fastapi.routing import APIRoute

from app.config.settings import settings
from app.main import app
from app.models.notification import Notification
from app.utils.jwt_handler import create_access_token


PROTECTED_READ_PATHS = [
    route.path
    for route in app.routes
    if isinstance(route, APIRoute)
    and route.path.startswith("/api/v1/")
    and "GET" in route.methods
]

VIEWER_READ_PATHS = [
    "/api/v1/auth/me",
    "/api/v1/risk-categories",
    "/api/v1/risk-categories/{category_id}",
    "/api/v1/risks",
    "/api/v1/risks/{risk_id}",
    "/api/v1/risks/{risk_id}/evaluations",
    "/api/v1/risks/{risk_id}/mitigation-plans",
    "/api/v1/mitigation-plans/{plan_id}",
    "/api/v1/mitigation-plans/{plan_id}/actions",
    "/api/v1/notifications",
    "/api/v1/dashboard/summary",
    "/api/v1/dashboard/risks-by-level",
    "/api/v1/dashboard/risks-by-category",
    "/api/v1/dashboard/risks-by-status",
    "/api/v1/dashboard/risk-trend",
    "/api/v1/dashboard/mitigations-by-status",
    "/api/v1/dashboard/risk-matrix",
    "/api/v1/reports/risks",
    "/api/v1/reports/mitigations",
    "/api/v1/reports/critical-risks",
    "/api/v1/analytics",
]


@pytest.fixture
def business_records(client, user_factory, headers_for):
    analyst = user_factory("ANALYST")
    headers = headers_for(analyst)
    categories = client.get("/api/v1/risk-categories", headers=headers).json()["data"]
    category_id = categories[0]["id"]
    risk_response = client.post(
        "/api/v1/risks",
        headers=headers,
        json={"title": "Riesgo de prueba", "category_id": category_id, "probability": 2, "impact": 3},
    )
    assert risk_response.status_code == 200
    risk_id = risk_response.json()["data"]["id"]
    due_date = (date.today() + timedelta(days=30)).isoformat()
    plan_response = client.post(
        f"/api/v1/risks/{risk_id}/mitigation-plans",
        headers=headers,
        json={
            "title": "Plan de prueba",
            "responsible_user_id": analyst.id,
            "start_date": date.today().isoformat(),
            "due_date": due_date,
        },
    )
    assert plan_response.status_code == 200
    plan_id = plan_response.json()["data"]["id"]
    return {"category_id": category_id, "risk_id": risk_id, "plan_id": plan_id}


@pytest.mark.parametrize("path", PROTECTED_READ_PATHS)
def test_api_reads_require_authentication(client, path):
    response = client.get(re.sub(r"\{[^}]+\}", "1", path))

    assert response.status_code == 401
    assert response.json()["error_code"] == "MISSING_TOKEN"


@pytest.mark.parametrize("path", VIEWER_READ_PATHS)
def test_viewer_can_read_business_data(client, viewer_headers, business_records, path):
    response = client.get(path.format(**business_records), headers=viewer_headers)

    assert response.status_code == 200
    assert response.json()["success"] is True


@pytest.mark.parametrize("method", ["post", "put", "delete"])
def test_viewer_cannot_modify_risks(client, viewer_headers, business_records, method):
    risk_id = business_records["risk_id"]
    path = "/api/v1/risks" if method == "post" else f"/api/v1/risks/{risk_id}"
    payload = {"title": "Cambio no permitido", "category_id": business_records["category_id"]}

    response = client.request(method, path, headers=viewer_headers, json=payload)

    assert response.status_code == 403
    stored = client.get(f"/api/v1/risks/{risk_id}", headers=viewer_headers).json()["data"]
    assert stored["title"] == "Riesgo de prueba"


@pytest.mark.parametrize("path", ["/api/v1/users", "/api/v1/users/1"])
def test_user_directory_keeps_existing_role_restrictions(client, viewer_headers, path):
    response = client.get(path, headers=viewer_headers)

    assert response.status_code == 403


@pytest.mark.parametrize("subject", [None, "", "abc", "0", "-1", "1.2", " 1", "1 ", 1, True, [], {}, str(2**80)])
def test_malformed_jwt_subject_is_unauthorized(client, user_factory, subject):
    user = user_factory()
    token = create_access_token(str(user.id), extra_claims={"sub": subject})

    response = client.get("/api/v1/risks", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 401
    assert response.json()["error_code"] == "INVALID_TOKEN"


@pytest.mark.parametrize("missing_claim", ["exp", "sub", "iat"])
def test_jwt_requires_expiry_subject_and_issued_at(client, user_factory, missing_claim):
    user = user_factory()
    now = datetime.now(timezone.utc)
    payload = {"sub": str(user.id), "iat": now, "exp": now + timedelta(minutes=5)}
    del payload[missing_claim]
    token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

    response = client.get("/api/v1/risks", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 401
    assert response.json()["error_code"] == "INVALID_TOKEN"


def test_expired_jwt_is_unauthorized(client, user_factory):
    user = user_factory()
    token = create_access_token(
        str(user.id), extra_claims={"exp": datetime.now(timezone.utc) - timedelta(seconds=1)}
    )

    response = client.get("/api/v1/risks", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 401
    assert response.json()["error_code"] == "TOKEN_EXPIRED"


def test_invalid_jwt_is_unauthorized(client):
    response = client.get("/api/v1/risks", headers={"Authorization": "Bearer invalid-token"})

    assert response.status_code == 401
    assert response.json()["error_code"] == "INVALID_TOKEN"


def test_inactive_user_cannot_use_a_valid_jwt(client, user_factory, headers_for):
    user = user_factory(is_active=False)

    response = client.get("/api/v1/risks", headers=headers_for(user))

    assert response.status_code == 401
    assert response.json()["error_code"] == "USER_INACTIVE"


@pytest.fixture
def private_notification(db_session, user_factory):
    owner = user_factory()
    notification = Notification(
        user_id=owner.id,
        title="Aviso privado",
        message="Contenido exclusivo del propietario",
        type="RISK_ASSIGNED",
    )
    db_session.add(notification)
    db_session.commit()
    db_session.refresh(notification)
    return notification, owner


def test_marking_a_notification_requires_authentication(client, db_session, private_notification):
    notification, _ = private_notification

    response = client.put(f"/api/v1/notifications/{notification.id}/read")

    assert response.status_code == 401
    db_session.refresh(notification)
    assert notification.is_read is False


@pytest.mark.parametrize("role", ["VIEWER", "ADMIN"])
def test_foreign_private_notification_is_not_disclosed_or_changed(
    client, db_session, private_notification, user_factory, headers_for, role
):
    notification, _ = private_notification
    other_user = user_factory(role)
    headers = headers_for(other_user)

    response = client.put(f"/api/v1/notifications/{notification.id}/read", headers=headers)
    missing_response = client.put(f"/api/v1/notifications/{notification.id + 1000}/read", headers=headers)

    assert response.status_code == missing_response.status_code == 404
    assert response.json()["error_code"] == missing_response.json()["error_code"] == "NOTIFICATION_NOT_FOUND"
    assert response.json()["message"] == missing_response.json()["message"]
    assert "data" not in response.json()
    assert notification.title not in response.text
    assert notification.message not in response.text
    db_session.refresh(notification)
    assert notification.is_read is False


def test_owner_can_mark_a_private_notification_read(client, db_session, private_notification, headers_for):
    notification, owner = private_notification

    response = client.put(f"/api/v1/notifications/{notification.id}/read", headers=headers_for(owner))

    assert response.status_code == 200
    assert response.json()["data"]["id"] == notification.id
    assert response.json()["data"]["is_read"] is True
    db_session.refresh(notification)
    assert notification.is_read is True


def test_authenticated_users_can_mark_broadcast_notifications_read(client, db_session, viewer_headers):
    notification = Notification(user_id=None, title="Aviso general", message="Visible para todos", type="RISK_CRITICAL")
    db_session.add(notification)
    db_session.commit()
    db_session.refresh(notification)

    response = client.put(f"/api/v1/notifications/{notification.id}/read", headers=viewer_headers)

    assert response.status_code == 200
    assert response.json()["data"]["user_id"] is None
    db_session.refresh(notification)
    assert notification.is_read is True


def test_cors_preflight_does_not_require_a_bearer_token(client):
    if not settings.cors_origins_list:
        pytest.skip("No CORS origins configured for this environment")
    origin = settings.cors_origins_list[0]

    response = client.options(
        "/api/v1/risks",
        headers={"Origin": origin, "Access-Control-Request-Method": "GET"},
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == origin


def test_health_remains_public(client):
    response = client.get("/health")

    assert response.status_code == 200
