from datetime import date

from pydantic import BaseModel


class WeeklyProductivityPoint(BaseModel):
    day: str
    date: date
    completed_tasks: int


class AnalyticsOverview(BaseModel):
    total_tasks: int
    completed_tasks: int
    pending_tasks: int
    overdue_tasks: int
    completion_rate: float
    high_priority_tasks: int
    medium_priority_tasks: int
    low_priority_tasks: int
    tasks_completed_today: int
    tasks_completed_this_week: int
    current_streak: int
    longest_streak: int
    productivity_points: int
    weekly_productivity: list[WeeklyProductivityPoint]