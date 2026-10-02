from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict, Field


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    full_name: str
    email: EmailStr
    is_active: bool
    roles: list[str] = []
    created_at: datetime


class UserCreateRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=150)
    email: EmailStr
    password: str = Field(min_length=8)
    roles: list[str] = Field(default_factory=lambda: ["VIEWER"])


class UserUpdateRequest(BaseModel):
    full_name: str | None = None
    is_active: bool | None = None
    roles: list[str] | None = None


class UserProfileUpdateRequest(BaseModel):
    full_name: str | None = None