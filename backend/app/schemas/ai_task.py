from datetime import date

from pydantic import BaseModel


class TaskAnalysis(BaseModel):
    task_id: str
    summary: str
    suggested_priority: str
    estimated_effort: str
    suggested_subtasks: list[str]
    suggested_deadline: date
    potential_blockers: list[str]
    recommended_next_action: str