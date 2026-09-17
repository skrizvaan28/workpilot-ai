from datetime import date, datetime, timezone
from threading import Lock
from uuid import uuid4

from app.schemas.task import TaskCreate, TaskOut, TaskUpdate


_tasks: dict[str, TaskOut] = {}
_tasks_lock = Lock()


def list_tasks(owner_id: str) -> list[TaskOut]:
    with _tasks_lock:
        return sorted(
            (task for task in _tasks.values() if task.owner_id == owner_id),
            key=lambda task: (task.completed, task.due_date or date.max, task.created_at),
        )


def create_task(owner_id: str, task_in: TaskCreate) -> TaskOut:
    now = datetime.now(timezone.utc)
    task = TaskOut(
        id=str(uuid4()),
        owner_id=owner_id,
        title=task_in.title,
        description=task_in.description,
        priority=task_in.priority,
        due_date=task_in.due_date,
        completed=False,
        created_at=now,
        updated_at=now,
    )
    with _tasks_lock:
        _tasks[task.id] = task
    return task


def get_task(owner_id: str, task_id: str) -> TaskOut | None:
    with _tasks_lock:
        task = _tasks.get(task_id)
        return task if task and task.owner_id == owner_id else None


def update_task(owner_id: str, task_id: str, task_in: TaskUpdate) -> TaskOut | None:
    with _tasks_lock:
        task = _tasks.get(task_id)
        if not task or task.owner_id != owner_id:
            return None
        values = task_in.model_dump(exclude_unset=True)
        updated = task.model_copy(update={**values, "updated_at": datetime.now(timezone.utc)})
        _tasks[task_id] = updated
        return updated


def delete_task(owner_id: str, task_id: str) -> bool:
    with _tasks_lock:
        task = _tasks.get(task_id)
        if not task or task.owner_id != owner_id:
            return False
        del _tasks[task_id]
        return True


def complete_task(owner_id: str, task_id: str) -> TaskOut | None:
    with _tasks_lock:
        task = _tasks.get(task_id)
        if not task or task.owner_id != owner_id:
            return None
        updated = task.model_copy(
            update={"completed": True, "updated_at": datetime.now(timezone.utc)}
        )
        _tasks[task_id] = updated
        return updated