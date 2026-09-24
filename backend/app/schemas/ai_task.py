from datetime import date
from typing import Literal

from pydantic import BaseModel, Field


class TaskAnalysis(BaseModel):
    task_id: str
    summary: str
    suggested_priority: str
    estimated_effort: str
    suggested_subtasks: list[str]
    suggested_deadline: date
    potential_blockers: list[str]
    recommended_next_action: str


class TaskCopilotKnowledgeSource(BaseModel):
    document_id: str
    title: str
    filename: str
    chunk_index: int
    content: str
    similarity: float
    embedding_model: str


class TaskCopilotRequest(BaseModel):
    action: Literal["breakdown", "checklist", "priority", "deadline", "blockers", "next_steps", "knowledge_context"]
    question: str | None = Field(default=None, max_length=2000)


class TaskCopilotResponse(BaseModel):
    answer: str
    suggested_steps: list[str] = []
    checklist: list[str] = []
    blockers: list[str] = []
    recommended_priority: str | None = None
    recommended_deadline: str | None = None
    knowledge_context_found: bool = False
    knowledge_sources: list[TaskCopilotKnowledgeSource] = []