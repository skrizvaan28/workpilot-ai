from fastapi import APIRouter, Depends

from app.api.deps import get_optional_token_subject
from app.schemas.ai import TaskInsightRequest, TaskInsightResponse
from app.services.ai_service import generate_task_insight

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/task-insight", response_model=TaskInsightResponse)
def create_task_insight(
    payload: TaskInsightRequest,
    _subject: str | None = Depends(get_optional_token_subject),
) -> TaskInsightResponse:
    return generate_task_insight(payload)
