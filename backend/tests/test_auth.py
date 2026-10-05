def test_register_and_login(client):
    register_payload = {
        "full_name": "Ana Perez",
        "email": "ana@example.com",
        "password": "Password123",
    }
    response = client.post("/api/v1/auth/register", json=register_payload)
    assert response.status_code == 200
    assert response.json()["success"] is True

    login_response = client.post("/api/v1/auth/login", json={
        "email": "ana@example.com", "password": "Password123",
    })
    assert login_response.status_code == 200
    body = login_response.json()
    assert body["success"] is True
    assert "access_token" in body["data"]


def test_login_with_invalid_credentials(client):
    response = client.post("/api/v1/auth/login", json={
        "email": "noexiste@example.com", "password": "wrongpass",
    })
    assert response.status_code == 401
    assert response.json()["success"] is False