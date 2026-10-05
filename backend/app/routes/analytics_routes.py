from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.controllers import analytics_controller

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("")
def get_analytics(db: Session = Depends(get_db)):
    return analytics_controller.get_analytics(db)