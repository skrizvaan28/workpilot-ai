from datetime import date
from typing import Any, Literal

from pydantic import BaseModel, Field

from app.schemas.task import TaskOut


CopilotIntent = Literal[
    "GREETING",
    "LIST_TASKS",
    "OVERDUE_TASKS",
    "HIGH_PRIORITY_TASKS",
    "CREATE_TASK",
    "GET_TASK_DETAILS",
    "UPDATE_TASK",
    "COMPLETE_TASK",
    "DELETE_TASK",
    "TASK_EXPLANATION",
    "TASK_PLANNING",
    "WORKLOAD_SUMMARY",
    "PRODUCTIVITY_SUMMARY",
    "KNOWLEDGE_SEARCH",
    "GENERAL_HELP",
]


class CopilotRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)


class CopilotAction(BaseModel):
    type: Literal[
        "CREATE_TASK",
        "GET_TASK_DETAILS",
        "UPDATE_TASK",
        "COMPLETE_TASK",
        "DELETE_TASK",
        "VIEW_TASK",
        "COMPLETE_TASK",
        "SEARCH_KNOWLEDGE",
        "VIEW_ANALYTICS",
    ]
    label: str
    task_id: str | None = None


class CopilotWorkloadSummary(BaseModel):
    total_tasks: int
    completed: int
    in_progress: int
    pending: int
    overdue: int
    high_priority: int


class CopilotResponse(BaseModel):
    intent: CopilotIntent
    success: bool = True
    message: str
    action: str | None = None
    requires_confirmation: bool = False
    confirmation_action: str | None = None
    data: list[Any] | dict[str, Any] | None = None
    tasks: list[TaskOut] = Field(default_factory=list)
    knowledge_sources: list[dict[str, Any]] = Field(default_factory=list)
    actions: list[CopilotAction] = Field(default_factory=list)
    workload: CopilotWorkloadSummary | None = None
    task: TaskOut | None = None
    answer: str | None = None
    suggested_steps: list[str] = Field(default_factory=list)
    due_date: date | None = None
