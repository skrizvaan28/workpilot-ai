from dataclasses import dataclass
import re

from app.crud.task import complete_task, create_task, get_task, list_tasks, update_task
from app.schemas.task import TaskCreate, TaskOut, TaskUpdate


@dataclass
class TaskResolution:
    task: TaskOut | None = None
    candidates: list[TaskOut] | None = None

    @property
    def ambiguous(self) -> bool:
        return bool(self.candidates and len(self.candidates) > 1)


def _normalize_title(value: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9 ]", " ", value.lower())).strip()


def get_user_tasks(owner_id: str) -> list[TaskOut]:
    return list_tasks(owner_id)


def resolve_user_task(owner_id: str, task_reference: str) -> TaskResolution:
    reference = _normalize_title(task_reference)
    reference = re.sub(r"^(?:my|the)\s+", "", reference)
    reference = re.sub(r"\s+task$", "", reference).strip()
    if not reference:
        return TaskResolution()

    tasks = list_tasks(owner_id)
    exact = [task for task in tasks if _normalize_title(task.title) == reference]
    if len(exact) == 1:
        return TaskResolution(task=exact[0])
    if len(exact) > 1:
        return TaskResolution(candidates=exact)

    matches = [
        task
        for task in tasks
        if reference in _normalize_title(task.title) or _normalize_title(task.title) in reference
    ]
    if len(matches) == 1:
        return TaskResolution(task=matches[0])
    return TaskResolution(candidates=matches or None)


def get_user_task(owner_id: str, task_id: str) -> TaskOut | None:
    return get_task(owner_id, task_id)


def create_user_task(owner_id: str, task_in: TaskCreate) -> TaskOut:
    return create_task(owner_id, task_in)


def update_user_task(owner_id: str, task_id: str, task_in: TaskUpdate) -> TaskOut | None:
    return update_task(owner_id, task_id, task_in)


def complete_user_task(owner_id: str, task_id: str) -> TaskOut | None:
    return complete_task(owner_id, task_id)
