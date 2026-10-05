from sqlalchemy.orm import Session
from app.services.analytics_service import AnalyticsService
from app.utils.response_helper import success_response


def get_analytics(db: Session):
    return success_response(AnalyticsService(db).build_analytics())