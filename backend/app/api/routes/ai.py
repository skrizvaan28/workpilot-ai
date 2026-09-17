from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_optional_token_subject
from app.api.deps import get_current_user
from app.crud.task import get_task
from app.models.user import User
from app.schemas.ai_document import DocumentTaskRequest, DocumentTaskResponse
from app.schemas.ai import TaskInsightRequest, TaskInsightResponse
from app.schemas.ai_task import TaskAnalysis
from app.services.ai_service import generate_task_insight
from app.services.ai_task_service import analyze_task
from app.services.ai_document_task_service import extract_tasks

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/task-insight", response_model=TaskInsightResponse)
def create_task_insight(
    payload: TaskInsightRequest,
    _subject: str | None = Depends(get_optional_token_subject),
) -> TaskInsightResponse:
    return generate_task_insight(payload)


@router.post("/tasks/{task_id}/analyze", response_model=TaskAnalysis)
def analyze_existing_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
) -> TaskAnalysis:
    task = get_task(current_user.id, task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return analyze_task(task, current_user)


@router.post("/documents/tasks", response_model=DocumentTaskResponse)
def extract_document_tasks(
    payload: DocumentTaskRequest,
    _current_user: User = Depends(get_current_user),
) -> DocumentTaskResponse:
    return extract_tasks(payload.content)
