from datetime import date, timedelta

from app.models.user import User
from app.schemas.ai_task import TaskAnalysis
from app.schemas.task import TaskOut


def analyze_task(task: TaskOut, _user: User) -> TaskAnalysis:
    """Return deterministic task guidance behind a provider-ready service boundary."""
    text = f"{task.title} {task.description}".lower()
    suggested_priority = task.priority

    if any(keyword in text for keyword in ("critical", "incident", "security", "launch")):
        suggested_priority = "high"
    elif task.priority == "low" and any(keyword in text for keyword in ("deadline", "client", "review")):
        suggested_priority = "medium"

    if len(text) > 180 or any(keyword in text for keyword in ("migration", "integration", "architecture", "redesign")):
        effort = "High"
    elif len(text) > 70 or any(keyword in text for keyword in ("implement", "analyze", "document", "workflow")):
        effort = "Medium"
    else:
        effort = "Low"

    if task.completed:
        subtasks = ["Verify the delivered outcome", "Share completion notes with stakeholders"]
        next_action = "Review the completed deliverable and close any follow-up work."
    elif effort == "High":
        subtasks = [
            "Clarify scope and acceptance criteria",
            "Break the work into implementation milestones",
            "Validate the result with stakeholders",
        ]
        next_action = "Define the first milestone and identify the owner for each dependency."
    else:
        subtasks = [
            "Confirm the expected outcome",
            "Complete the primary work",
            "Review and share the result",
        ]
        next_action = "Start with the smallest concrete step and schedule a focused work block."

    blockers: list[str] = []
    if not task.description.strip():
        blockers.append("The task has no description or acceptance criteria yet.")
    if task.due_date is None:
        blockers.append("No due date is set, so delivery timing is undefined.")
    if any(keyword in text for keyword in ("dependency", "blocked", "waiting", "approval")):
        blockers.append("The task may depend on an external decision or another team.")
    if not blockers:
        blockers.append("No obvious blockers found from the available task context.")

    suggested_deadline = task.due_date or date.today() + timedelta(days=7 if effort == "High" else 3)
    status = "completed" if task.completed else "open"
    summary = f"{task.title} is {status} with {suggested_priority} priority and a {effort.lower()} delivery profile."

    return TaskAnalysis(
        task_id=task.id,
        summary=summary,
        suggested_priority=suggested_priority,
        estimated_effort=effort,
        suggested_subtasks=subtasks,
        suggested_deadline=suggested_deadline,
        potential_blockers=blockers,
        recommended_next_action=next_action,
    )