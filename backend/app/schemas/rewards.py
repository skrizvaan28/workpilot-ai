from pydantic import BaseModel


class RewardsOverview(BaseModel):
    total_points: int
    current_streak: int
    longest_streak: int
    tasks_completed_today: int
    total_completed_tasks: int
    unlocked_badges: list[str]