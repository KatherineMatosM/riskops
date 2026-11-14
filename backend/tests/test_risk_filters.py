from datetime import datetime

import pytest
from sqlalchemy import select

from app.models.risk import Risk
from app.models.risk_category import RiskCategory


@pytest.mark.parametrize("field,value", [
    ("page", "0"),
    ("page", "-1"),
    ("page_size", "0"),
    ("page_size", "-1"),
    ("page_size", "101"),
    ("sort_by", "__table__"),
    ("sort_by", "category"),
    ("sort_by", "title.desc"),
    ("sort_by", "no_existe"),
    ("sort_dir", "UP"),
    ("sort_dir", "descending"),
])
def test_invalid_pagination_and_sorting_return_query_errors(client, viewer_headers, field, value):
    response = client.get("/api/v1/risks", headers=viewer_headers, params={field: value})

    assert response.status_code == 422
    body = response.json()
    assert body["error_code"] == "VALIDATION_ERROR"
    assert any(
        error["field"] == field and error["location"] == ["query", field]
        for error in body["errors"]
    )


def test_valid_sorting_and_pagination_preserve_totals(client, db_session, user_factory, headers_for):
    viewer = user_factory("VIEWER")
    category_id = db_session.scalar(select(RiskCategory.id).order_by(RiskCategory.id))
    for day, title in enumerate(("Charlie", "Alfa", "Bravo"), start=1):
        db_session.add(Risk(
            title=title, category_id=category_id, created_by=viewer.id,
            created_at=datetime(2030, 1, day),
        ))
    db_session.commit()
    headers = headers_for(viewer)

    response = client.get("/api/v1/risks", headers=headers, params={
        "sort_by": "title", "sort_dir": "asc", "page": 1, "page_size": 2,
    })
    assert response.status_code == 200
    first = response.json()["data"]
    assert [risk["title"] for risk in first["items"]] == ["Alfa", "Bravo"]
    assert {key: first[key] for key in ("total", "page", "page_size", "total_pages")} == {
        "total": 3, "page": 1, "page_size": 2, "total_pages": 2,
    }

    response = client.get("/api/v1/risks", headers=headers, params={
        "sort_by": "title", "sort_dir": "asc", "page": 2, "page_size": 2,
    })
    assert response.status_code == 200
    second = response.json()["data"]
    assert [risk["title"] for risk in second["items"]] == ["Charlie"]
    assert second["total"] == 3 and second["total_pages"] == 2

    response = client.get("/api/v1/risks", headers=headers, params={"page_size": 100})
    assert response.status_code == 200
    assert [risk["title"] for risk in response.json()["data"]["items"]] == ["Bravo", "Alfa", "Charlie"]
