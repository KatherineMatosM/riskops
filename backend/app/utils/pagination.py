from pydantic import BaseModel
from typing import Generic, TypeVar, Sequence

T = TypeVar("T")


class PageParams(BaseModel):
    page: int = 1
    page_size: int = 20

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size


class PageResult(BaseModel, Generic[T]):
    items: Sequence[T]
    total: int
    page: int
    page_size: int
    total_pages: int