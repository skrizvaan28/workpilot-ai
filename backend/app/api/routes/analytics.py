from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.crud.task import list_tasks
from app.models.user import User
from app.schemas.analytics import AnalyticsOverview
from app.services.analytics_service import get_analytics_overview

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/overview", response_model=AnalyticsOverview)
def analytics_overview(current_user: User = Depends(get_current_user)) -> AnalyticsOverview:
    return get_analytics_overview(list_tasks(current_user.id), current_user)