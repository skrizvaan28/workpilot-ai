from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_user
from app.crud.task import complete_task, create_task, delete_task, list_tasks, update_task
from app.models.user import User
from app.schemas.task import TaskCreate, TaskOut, TaskUpdate

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("", response_model=list[TaskOut])
def read_tasks(current_user: User = Depends(get_current_user)):
    return list_tasks(current_user.id)


@router.post("", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
def add_task(task_in: TaskCreate, current_user: User = Depends(get_current_user)):
    return create_task(current_user.id, task_in)


@router.put("/{task_id}", response_model=TaskOut)
def edit_task(
    task_id: str,
    task_in: TaskUpdate,
    current_user: User = Depends(get_current_user),
):
    task = update_task(current_user.id, task_id, task_in)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_task(task_id: str, current_user: User = Depends(get_current_user)):
    if not delete_task(current_user.id, task_id):
        raise HTTPException(status_code=404, detail="Task not found")


@router.patch("/{task_id}/complete", response_model=TaskOut)
def mark_task_complete(task_id: str, current_user: User = Depends(get_current_user)):
    task = complete_task(current_user.id, task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return task