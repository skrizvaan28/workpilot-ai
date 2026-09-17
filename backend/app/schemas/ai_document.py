from datetime import date

from pydantic import BaseModel, Field


class DocumentTaskRequest(BaseModel):
    content: str = Field(min_length=1, max_length=20000)


class ExtractedTask(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    description: str = Field(default="", max_length=2000)
    priority: str = Field(pattern="^(low|medium|high)$")
    due_date: date | None = None
    estimated_effort: str = Field(pattern="^(Low|Medium|High)$")


class DocumentTaskResponse(BaseModel):
    tasks: list[ExtractedTask]