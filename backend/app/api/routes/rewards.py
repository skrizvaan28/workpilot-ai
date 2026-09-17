from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.crud.task import list_tasks
from app.models.user import User
from app.schemas.rewards import RewardsOverview
from app.services.rewards_service import get_rewards_overview

router = APIRouter(prefix="/rewards", tags=["rewards"])


@router.get("/overview", response_model=RewardsOverview)
def rewards_overview(current_user: User = Depends(get_current_user)) -> RewardsOverview:
    return get_rewards_overview(list_tasks(current_user.id), current_user)