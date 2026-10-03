from datetime import date, datetime

from pydantic import BaseModel, Field


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    description: str = Field(default="", max_length=2000)
    priority: str = Field(default="medium", pattern="^(low|medium|high)$")
    due_date: date | None = None
    status: str = Field(default="pending", pattern="^(pending|in_progress|completed|overdue)$")
    progress: int = Field(default=0, ge=0, le=100)


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=160)
    description: str | None = Field(default=None, max_length=2000)
    priority: str | None = Field(default=None, pattern="^(low|medium|high)$")
    due_date: date | None = None
    status: str | None = Field(default=None, pattern="^(pending|in_progress|completed|overdue)$")
    progress: int | None = Field(default=None, ge=0, le=100)


class TaskOut(BaseModel):
    id: str
    owner_id: str
    title: str
    description: str
    priority: str
    due_date: date | None
    completed: bool
    status: str = "pending"
    progress: int = Field(default=0, ge=0, le=100)
    created_at: datetime
    updated_at: datetime