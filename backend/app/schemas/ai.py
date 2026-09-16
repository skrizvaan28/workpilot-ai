from typing import Literal

from pydantic import BaseModel, Field


class TaskInsightRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    description: str = Field(default="", max_length=4000)
    priority: str = Field(default="", max_length=40)
    category: str = Field(default="", max_length=120)
    due_date: str = Field(default="", max_length=80)
    progress: int = Field(default=0, ge=0, le=100)
    assignee: str = Field(default="", max_length=120)
    urgency: str = Field(default="", max_length=40)
    completed: bool = False
    status: str = Field(default="", max_length=40)


class TaskInsightResponse(BaseModel):
    # 7 Core AI Task Insight Dimensions
    priority: Literal["HIGH", "MEDIUM", "LOW"]
    deadline_risk: Literal["HIGH", "MEDIUM", "LOW"]
    urgency: Literal["HIGH", "MEDIUM", "LOW"]
    estimated_effort: Literal["Low", "Medium", "High"]
    completion_status: str
    recommended_action: str
    explanation: str

    # Backward compatibility fields
    risk_level: Literal["low", "medium", "high"] = "medium"
    risk_score: int = Field(default=50, ge=0, le=100)
    insight: str = ""
    reason: str = ""
    suggested_priority: Literal["low", "medium", "high"] = "medium"
    likely_overdue: bool = False
