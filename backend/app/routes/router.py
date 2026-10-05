from fastapi import APIRouter
from app.routes import (
    auth_routes, user_routes, risk_category_routes, risk_routes,
    risk_evaluation_routes, mitigation_plan_routes, mitigation_action_routes,
    notification_routes, dashboard_routes, report_routes, analytics_routes,
)

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_routes.router)
api_router.include_router(user_routes.router)
api_router.include_router(risk_category_routes.router)
api_router.include_router(risk_routes.router)
api_router.include_router(risk_evaluation_routes.router)
api_router.include_router(mitigation_plan_routes.router)
api_router.include_router(mitigation_action_routes.router)
api_router.include_router(notification_routes.router)
api_router.include_router(dashboard_routes.router)
api_router.include_router(report_routes.router)
api_router.include_router(analytics_routes.router)