def test_evaluation_validates_range(client):
    client.post("/api/v1/auth/register", json={
        "full_name": "User Test", "email": "user2@example.com", "password": "Password123",
    })
    login = client.post("/api/v1/auth/login", json={"email": "user2@example.com", "password": "Password123"})
    token = login.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    response = client.post(
        "/api/v1/risks/1/evaluations",
        json={"probability": 6, "impact": 3},
        headers=headers,
    )
    assert response.status_code == 422