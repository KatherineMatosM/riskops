import pytest
from sqlalchemy import select

from app.models.risk import Risk
from app.models.risk_category import RiskCategory
from app.repositories.risk_repository import RiskRepository


@pytest.fixture
def matrix_records(db_session, user_factory, headers_for):
    viewer = user_factory("VIEWER")
    user_id = viewer.id
    category_id = db_session.scalar(select(RiskCategory.id).order_by(RiskCategory.id))
    cases = [
        ("Celda A", 5, 5), ("Celda B", 5, 5), ("Celda C", 5, 5),
        ("Misma probabilidad", 5, 2), ("Mismo impacto", 2, 5), ("Sin evaluar", None, None),
    ]
    for title, probability, impact in cases:
        db_session.add(Risk(
            title=title, category_id=category_id, created_by=user_id,
            probability=probability, impact=impact,
        ))
    db_session.commit()
    return {"headers": headers_for(viewer), "category_id": category_id}


def test_matrix_cell_axes_filter_total_and_paginated_items(client, matrix_records):
    query = {"probability": 5, "impact": 5, "sort_by": "title", "sort_dir": "asc", "page_size": 2}
    first = client.get("/api/v1/risks", headers=matrix_records["headers"], params={**query, "page": 1})
    assert first.status_code == 200
    data = first.json()["data"]
    assert [risk["title"] for risk in data["items"]] == ["Celda A", "Celda B"]
    assert data["total"] == 3 and data["total_pages"] == 2
    assert all((risk["probability"], risk["impact"]) == (5, 5) for risk in data["items"])
    second = client.get("/api/v1/risks", headers=matrix_records["headers"], params={**query, "page": 2})
    assert second.status_code == 200
    data = second.json()["data"]
    assert [risk["title"] for risk in data["items"]] == ["Celda C"]
    assert data["total"] == 3 and data["total_pages"] == 2


@pytest.mark.parametrize("axes,expected", [
    ({"probability": 5}, {"Celda A", "Celda B", "Celda C", "Misma probabilidad"}),
    ({"impact": 5}, {"Celda A", "Celda B", "Celda C", "Mismo impacto"}),
    ({"probability": 1, "impact": 1}, set()),
    ({}, {"Celda A", "Celda B", "Celda C", "Misma probabilidad", "Mismo impacto", "Sin evaluar"}),
])
def test_single_empty_or_omitted_axes_remain_independent(client, matrix_records, axes, expected):
    response = client.get("/api/v1/risks", headers=matrix_records["headers"], params=axes)
    assert response.status_code == 200
    result = response.json()["data"]
    assert {risk["title"] for risk in result["items"]} == expected
    assert result["total"] == len(expected)


def test_matrix_axes_combine_with_existing_category_and_search_filters(client, matrix_records):
    response = client.get("/api/v1/risks", headers=matrix_records["headers"], params={
        "probability": 5, "impact": 5, "category_id": matrix_records["category_id"], "search": "Celda B",
    })
    assert response.status_code == 200
    assert [risk["title"] for risk in response.json()["data"]["items"]] == ["Celda B"]
    assert response.json()["data"]["total"] == 1


@pytest.mark.parametrize("field,value", [
    ("probability", 0), ("probability", 6), ("impact", 0), ("impact", 6),
    ("probability", "invalid"), ("impact", "invalid"),
])
def test_matrix_axes_reject_invalid_query_values(client, viewer_headers, field, value):
    response = client.get("/api/v1/risks", headers=viewer_headers, params={field: value})
    assert response.status_code == 422
    assert any(error["field"] == field and error["location"] == ["query", field] for error in response.json()["errors"])


def test_direct_repository_call_remains_compatible_without_axes(db_session, matrix_records):
    rows, total = RiskRepository(db_session).list_filtered(
        category_id=None, status=None, risk_level=None, responsible_user_id=None, search=None,
        page=1, page_size=20, sort_by="id", sort_dir="asc",
    )
    assert total == 6
    assert len(rows) == 6
