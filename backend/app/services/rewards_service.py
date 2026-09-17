from datetime import date, timedelta

from app.models.user import User
from app.schemas.rewards import RewardsOverview
from app.schemas.task import TaskOut


POINTS_BY_PRIORITY = {"low": 10, "medium": 15, "high": 20}


def _active_dates(tasks: list[TaskOut]) -> list[date]:
    return sorted({task.updated_at.date() for task in tasks if task.completed})


def _streaks(active_dates: list[date], today: date) -> tuple[int, int]:
    if not active_dates:
        return 0, 0

    longest = current = 1
    for previous, active in zip(active_dates, active_dates[1:]):
        if active == previous + timedelta(days=1):
            current += 1
        else:
            current = 1
        longest = max(longest, current)

    active_set = set(active_dates)
    anchor = today if today in active_set else today - timedelta(days=1)
    current_streak = 0
    while anchor in active_set:
        current_streak += 1
        anchor -= timedelta(days=1)
    return current_streak, longest


def get_rewards_overview(tasks: list[TaskOut], _user: User) -> RewardsOverview:
    completed = [task for task in tasks if task.completed]
    active_dates = _active_dates(completed)
    current_streak, longest_streak = _streaks(active_dates, date.today())
    total_points = sum(POINTS_BY_PRIORITY.get(task.priority, 10) for task in completed)
    completed_today = sum(1 for task in completed if task.updated_at.date() == date.today())

    badges: list[str] = []
    if completed:
        badges.append("First Task")
    if len(completed) >= 5:
        badges.append("5 Tasks Completed")
    if len(completed) >= 10:
        badges.append("10 Tasks Completed")
    if longest_streak >= 7:
        badges.append("7 Day Streak")

    return RewardsOverview(
        total_points=total_points,
        current_streak=current_streak,
        longest_streak=longest_streak,
        tasks_completed_today=completed_today,
        total_completed_tasks=len(completed),
        unlocked_badges=badges,
    )