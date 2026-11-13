def test_evaluation_validates_range(client, analyst_headers):
    categories = client.get("/api/v1/risk-categories", headers=analyst_headers).json()["data"]
    created = client.post(
        "/api/v1/risks",
        json={"title": "Riesgo de evaluación", "category_id": categories[0]["id"]},
        headers=analyst_headers,
    )
    assert created.status_code == 200
    risk_id = created.json()["data"]["id"]

    response = client.post(
        f"/api/v1/risks/{risk_id}/evaluations",
        json={"probability": 6, "impact": 3},
        headers=analyst_headers,
    )
    assert response.status_code == 422
