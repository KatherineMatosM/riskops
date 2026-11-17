from app.utils.password_hasher import verify_password


def test_incorrect_current_password_preserves_authentication_and_password(client, user_factory, headers_for):
    user = user_factory()
    headers = headers_for(user)
    payload = {
        "current_password": "private-incorrect-password",
        "new_password": "private-new-password",
    }

    response = client.post("/api/v1/auth/change-password", headers=headers, json=payload)

    assert response.status_code == 422
    assert response.json() == {
        "success": False,
        "message": "La contrasena actual es incorrecta.",
        "error_code": "INVALID_CURRENT_PASSWORD",
        "errors": [{
            "field": "current_password",
            "location": ["body", "current_password"],
            "message": "La contrasena actual es incorrecta.",
            "type": "invalid_password",
        }],
    }
    assert "www-authenticate" not in response.headers
    assert payload["current_password"] not in response.text
    assert payload["new_password"] not in response.text
    assert headers["Authorization"] not in response.text

    me_response = client.get("/api/v1/auth/me", headers=headers)
    assert me_response.status_code == 200
    assert me_response.json()["data"]["id"] == user.id

    login_response = client.post("/api/v1/auth/login", json={
        "email": user.email,
        "password": "Password123",
    })
    assert login_response.status_code == 200
    assert login_response.json()["data"]["access_token"]


def test_password_change_persists_and_replaces_the_login_password(client, db_session, user_factory, headers_for):
    user = user_factory()
    original_hash = user.password_hash
    new_password = "private-replacement-password"

    response = client.post(
        "/api/v1/auth/change-password",
        headers=headers_for(user),
        json={"current_password": "Password123", "new_password": new_password},
    )

    assert response.status_code == 200
    assert response.json()["success"] is True
    db_session.refresh(user)
    assert user.password_hash != original_hash
    assert user.password_hash != new_password
    assert verify_password(new_password, user.password_hash)
    assert not verify_password("Password123", user.password_hash)

    old_login_response = client.post("/api/v1/auth/login", json={
        "email": user.email,
        "password": "Password123",
    })
    assert old_login_response.status_code == 401
    assert old_login_response.json()["error_code"] == "INVALID_CREDENTIALS"

    new_login_response = client.post("/api/v1/auth/login", json={
        "email": user.email,
        "password": new_password,
    })
    assert new_login_response.status_code == 200
    assert new_login_response.json()["data"]["access_token"]


def test_password_change_requires_authentication_without_exposing_passwords(client):
    payload = {
        "current_password": "private-current-password",
        "new_password": "private-new-password",
    }

    response = client.post("/api/v1/auth/change-password", json=payload)

    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"
    assert response.json() == {
        "success": False,
        "message": "Token de autenticacion no proporcionado.",
        "error_code": "MISSING_TOKEN",
    }
    assert payload["current_password"] not in response.text
    assert payload["new_password"] not in response.text
