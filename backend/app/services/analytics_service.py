from datetime import date, timedelta

from app.models.user import User
from app.schemas.analytics import AnalyticsOverview, WeeklyProductivityPoint
from app.schemas.task import TaskOut
from app.services.rewards_service import get_rewards_overview


def get_analytics_overview(tasks: list[TaskOut], user: User) -> AnalyticsOverview:
    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    completed = [task for task in tasks if task.completed]
    pending = [task for task in tasks if not task.completed]
    overdue = [task for task in pending if task.due_date is not None and task.due_date < today]
    priority_counts = {
        priority: sum(1 for task in tasks if task.priority == priority)
        for priority in ("high", "medium", "low")
    }
    weekly_productivity = [
        WeeklyProductivityPoint(
            day=(week_start + timedelta(days=offset)).strftime("%A"),
            date=week_start + timedelta(days=offset),
            completed_tasks=sum(
                1
                for task in completed
                if task.updated_at.date() == week_start + timedelta(days=offset)
            ),
        )
        for offset in range(7)
    ]
    rewards = get_rewards_overview(tasks, user)

    return AnalyticsOverview(
        total_tasks=len(tasks),
        completed_tasks=len(completed),
        pending_tasks=len(pending),
        overdue_tasks=len(overdue),
        completion_rate=round((len(completed) / len(tasks)) * 100, 1) if tasks else 0,
        high_priority_tasks=priority_counts["high"],
        medium_priority_tasks=priority_counts["medium"],
        low_priority_tasks=priority_counts["low"],
        tasks_completed_today=sum(1 for task in completed if task.updated_at.date() == today),
        tasks_completed_this_week=sum(1 for task in completed if week_start <= task.updated_at.date() <= today),
        current_streak=rewards.current_streak,
        longest_streak=rewards.longest_streak,
        productivity_points=rewards.total_points,
        weekly_productivity=weekly_productivity,
    )