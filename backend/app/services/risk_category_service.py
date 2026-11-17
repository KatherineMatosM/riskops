from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.database.unit_of_work import atomic
from app.models.risk_category import RiskCategory
from app.repositories.risk_category_repository import RiskCategoryRepository
from app.utils.exceptions import NotFoundError, ConflictError
from app.schemas.risk_category_schema import RiskCategoryCreateRequest, RiskCategoryUpdateRequest, RiskCategoryOut


class RiskCategoryService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = RiskCategoryRepository(db)

    def list_categories(self) -> list[RiskCategoryOut]:
        return [RiskCategoryOut.model_validate(c) for c in self.repo.list_all()]

    def get_category(self, category_id: int) -> RiskCategoryOut:
        category = self.repo.get_by_id(category_id)
        if not category:
            raise NotFoundError("Categoria no encontrada.", "CATEGORY_NOT_FOUND")
        return RiskCategoryOut.model_validate(category)

    @atomic
    def create_category(self, data: RiskCategoryCreateRequest) -> RiskCategoryOut:
        if self.repo.get_by_name(data.name):
            raise ConflictError("La categoria ya existe.", "CATEGORY_ALREADY_EXISTS")
        category = RiskCategory(name=data.name, description=data.description, status="ACTIVE")
        try:
            category = self.repo.create(category)
        except IntegrityError as error:
            raise ConflictError("La categoria ya existe.", "CATEGORY_ALREADY_EXISTS") from error
        return RiskCategoryOut.model_validate(category)

    @atomic
    def update_category(self, category_id: int, data: RiskCategoryUpdateRequest) -> RiskCategoryOut:
        category = self.repo.get_by_id(category_id)
        if not category:
            raise NotFoundError("Categoria no encontrada.", "CATEGORY_NOT_FOUND")
        if data.name is not None:
            existing = self.repo.get_by_name(data.name)
            if existing and existing.id != category.id:
                raise ConflictError("La categoria ya existe.", "CATEGORY_ALREADY_EXISTS")
            category.name = data.name
        if "description" in data.model_fields_set:
            category.description = data.description
        if data.status is not None:
            category.status = data.status
        try:
            category = self.repo.update(category)
        except IntegrityError as error:
            raise ConflictError("La categoria ya existe.", "CATEGORY_ALREADY_EXISTS") from error
        return RiskCategoryOut.model_validate(category)

    @atomic
    def delete_category(self, category_id: int) -> None:
        category = self.repo.get_by_id(category_id)
        if not category:
            raise NotFoundError("Categoria no encontrada.", "CATEGORY_NOT_FOUND")
        try:
            self.repo.delete(category)
        except IntegrityError as error:
            raise ConflictError("La categoría está en uso y no puede eliminarse.", "CAT_IN_USE") from error
