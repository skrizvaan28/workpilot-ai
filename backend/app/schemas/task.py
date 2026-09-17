from datetime import date, datetime

from pydantic import BaseModel, Field


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    description: str = Field(default="", max_length=2000)
    priority: str = Field(default="medium", pattern="^(low|medium|high)$")
    due_date: date | None = None


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=160)
    description: str | None = Field(default=None, max_length=2000)
    priority: str | None = Field(default=None, pattern="^(low|medium|high)$")
    due_date: date | None = None


class TaskOut(BaseModel):
    id: str
    owner_id: str
    title: str
    description: str
    priority: str
    due_date: date | None
    completed: bool
    created_at: datetime
    updated_at: datetime