from sqlalchemy.orm import Session
from app.schemas.risk_category_schema import RiskCategoryCreateRequest, RiskCategoryUpdateRequest
from app.services.risk_category_service import RiskCategoryService
from app.utils.response_helper import success_response


def list_categories(db: Session):
    return success_response(RiskCategoryService(db).list_categories())


def get_category(category_id: int, db: Session):
    return success_response(RiskCategoryService(db).get_category(category_id))


def create_category(data: RiskCategoryCreateRequest, db: Session):
    return success_response(RiskCategoryService(db).create_category(data))


def update_category(category_id: int, data: RiskCategoryUpdateRequest, db: Session):
    return success_response(RiskCategoryService(db).update_category(category_id, data))


def delete_category(category_id: int, db: Session):
    RiskCategoryService(db).delete_category(category_id)
    return success_response({"message": "Categoria eliminada correctamente."})