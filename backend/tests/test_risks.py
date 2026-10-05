def _register_and_login(client, email="analyst@example.com"):
    client.post("/api/v1/auth/register", json={
        "full_name": "Analista Uno", "email": email, "password": "Password123",
    })
    response = client.post("/api/v1/auth/login", json={"email": email, "password": "Password123"})
    return response.json()["data"]["access_token"]


def test_create_risk_requires_authorized_role(client):
    token = _register_and_login(client)
    headers = {"Authorization": f"Bearer {token}"}

    categories = client.get("/api/v1/risk-categories").json()["data"]
    category_id = categories[0]["id"]

    response = client.post(
        "/api/v1/risks",
        json={"title": "Falla de servidor", "category_id": category_id, "probability": 4, "impact": 5},
        headers=headers,
    )
    assert response.status_code == 403


def test_risk_score_calculation():
    from app.utils.risk_calculator import compute_risk_score, classify_risk_level
    assert compute_risk_score(4, 5) == 20
    assert classify_risk_level(20) == "CRITICAL"
    assert classify_risk_level(3) == "LOW"
    assert classify_risk_level(6) == "MEDIUM"
    assert classify_risk_level(12) == "HIGH"