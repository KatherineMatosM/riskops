from sqlalchemy.orm import Session
from app.models.risk_category import RiskCategory
from app.repositories.risk_category_repository import RiskCategoryRepository
from app.utils.exceptions import NotFoundError, ConflictError
from app.schemas.risk_category_schema import RiskCategoryCreateRequest, RiskCategoryUpdateRequest, RiskCategoryOut


class RiskCategoryService:
    def __init__(self, db: Session):
        self.repo = RiskCategoryRepository(db)

    def list_categories(self) -> list[RiskCategoryOut]:
        return [RiskCategoryOut.model_validate(c) for c in self.repo.list_all()]

    def get_category(self, category_id: int) -> RiskCategoryOut:
        category = self.repo.get_by_id(category_id)
        if not category:
            raise NotFoundError("Categoria no encontrada.", "CATEGORY_NOT_FOUND")
        return RiskCategoryOut.model_validate(category)

    def create_category(self, data: RiskCategoryCreateRequest) -> RiskCategoryOut:
        if self.repo.get_by_name(data.name):
            raise ConflictError("La categoria ya existe.", "CATEGORY_ALREADY_EXISTS")
        category = RiskCategory(name=data.name, description=data.description, status="ACTIVE")
        category = self.repo.create(category)
        return RiskCategoryOut.model_validate(category)

    def update_category(self, category_id: int, data: RiskCategoryUpdateRequest) -> RiskCategoryOut:
        category = self.repo.get_by_id(category_id)
        if not category:
            raise NotFoundError("Categoria no encontrada.", "CATEGORY_NOT_FOUND")
        if data.name is not None:
            category.name = data.name
        if data.description is not None:
            category.description = data.description
        if data.status is not None:
            category.status = data.status
        category = self.repo.update(category)
        return RiskCategoryOut.model_validate(category)

    def delete_category(self, category_id: int) -> None:
        category = self.repo.get_by_id(category_id)
        if not category:
            raise NotFoundError("Categoria no encontrada.", "CATEGORY_NOT_FOUND")
        self.repo.delete(category)