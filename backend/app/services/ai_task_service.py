from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.ai_task import TaskAnalysis, TaskCopilotKnowledgeSource, TaskCopilotRequest, TaskCopilotResponse
from app.schemas.task import TaskOut
from app.services.knowledge_search_service import KnowledgeSearchService
from app.services.rag_service import KnowledgeRAGService


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


def _infer_priority(task: TaskOut) -> str:
    text = f"{task.title} {task.description}".lower()
    if any(keyword in text for keyword in ("critical", "incident", "security", "launch", "client", "production")):
        return "high"
    if task.priority == "low" and any(keyword in text for keyword in ("review", "deadline", "handoff", "compliance")):
        return "medium"
    return task.priority


def _suggested_deadline(task: TaskOut) -> str | None:
    if task.due_date is not None:
        return task.due_date.isoformat()
    delay = 2 if task.priority == "high" else 5 if task.priority == "medium" else 10
    return (date.today() + timedelta(days=delay)).isoformat()


def _task_blockers(task: TaskOut) -> list[str]:
    text = f"{task.title} {task.description}".lower()
    blockers: list[str] = []
    if not task.description.strip():
        blockers.append("The task needs a clearer description or acceptance criteria before execution.")
    if task.due_date is None:
        blockers.append("The task is missing a deadline, so timing is uncertain.")
    if any(keyword in text for keyword in ("dependency", "approval", "waiting", "blocked")):
        blockers.append("This task may depend on a stakeholder decision or another team.")
    if not blockers:
        blockers.append("No obvious blockers were detected from the available task context.")
    return blockers


def _task_breakdown(task: TaskOut) -> list[str]:
    title = task.title.strip() or "This task"
    base = [
        f"Clarify the expected outcome for {title}.",
        "Confirm the required inputs, dependencies, and success criteria.",
        "Complete the highest-impact work first and verify the result.",
        "Review the final output and share any follow-up actions.",
    ]
    if task.priority == "high":
        base.insert(1, "Prioritize the core deliverable and remove any blockers before secondary work.")
    return base


def _task_checklist(task: TaskOut) -> list[str]:
    return [
        f"Confirm the objective for: {task.title}",
        "Gather the necessary inputs and context.",
        "Complete the primary work item.",
        "Validate the result against the expected outcome.",
        "Document any follow-up items or handoff notes.",
    ]


def _task_next_steps(task: TaskOut) -> list[str]:
    return [
        "Start with the smallest actionable action that moves the task forward.",
        "Confirm whether the task depends on approvals, data, or another team.",
        "Validate the result before closing the task or handing it off.",
    ]


def generate_task_copilot(
    db: Session,
    task: TaskOut,
    user_id: str,
    request: TaskCopilotRequest,
) -> TaskCopilotResponse:
    action = request.action
    question = (request.question or "").strip()

    recommended_priority = _infer_priority(task)
    recommended_deadline = _suggested_deadline(task)
    blockers = _task_blockers(task)
    steps = _task_breakdown(task)
    checklist = _task_checklist(task)
    next_steps = _task_next_steps(task)

    if action == "breakdown":
        answer = (
            f"Here is a focused breakdown for '{task.title}': start with the core outcome, confirm the dependencies, "
            "complete the highest-impact work, and validate the finished result before closure."
        )
        return TaskCopilotResponse(
            answer=answer,
            suggested_steps=steps,
            blockers=blockers,
            recommended_priority=recommended_priority,
            recommended_deadline=recommended_deadline,
        )

    if action == "checklist":
        answer = f"Use this checklist to move '{task.title}' forward without losing the critical validation steps."
        return TaskCopilotResponse(
            answer=answer,
            checklist=checklist,
            blockers=blockers,
            recommended_priority=recommended_priority,
            recommended_deadline=recommended_deadline,
        )

    if action == "priority":
        answer = f"Based on the task context, the recommended priority is {recommended_priority}."
        return TaskCopilotResponse(
            answer=answer,
            recommended_priority=recommended_priority,
            blockers=blockers,
        )

    if action == "deadline":
        answer = f"A practical target date for this task is {recommended_deadline}."
        return TaskCopilotResponse(
            answer=answer,
            recommended_deadline=recommended_deadline,
            blockers=blockers,
        )

    if action == "blockers":
        answer = "These are the most likely blockers to address before this task moves forward."
        return TaskCopilotResponse(
            answer=answer,
            blockers=blockers,
            recommended_priority=recommended_priority,
        )

    if action == "next_steps":
        answer = f"The next steps for '{task.title}' are to confirm the outcome, validate the path, and complete the first meaningful milestone."
        return TaskCopilotResponse(
            answer=answer,
            suggested_steps=next_steps,
            blockers=blockers,
            recommended_priority=recommended_priority,
        )

    knowledge_question = question or f"What knowledge is relevant for '{task.title}'?"
    rag = KnowledgeRAGService(search_service=KnowledgeSearchService())
    rag_response = rag.answer_question(db, user_id, knowledge_question, top_k=5)
    knowledge_sources = [
        TaskCopilotKnowledgeSource(
            document_id=source.document_id,
            title=source.title,
            filename=source.filename,
            chunk_index=source.chunk_index,
            content=source.content,
            similarity=float(source.similarity),
            embedding_model=source.embedding_model,
        )
        for source in rag_response.sources
    ]

    answer = rag_response.answer or "I couldn't find enough information in the provided knowledge base context to answer that question accurately."
    return TaskCopilotResponse(
        answer=answer,
        knowledge_context_found=bool(rag_response.sources),
        knowledge_sources=knowledge_sources,
        blockers=blockers,
        recommended_priority=recommended_priority,
        recommended_deadline=recommended_deadline,
    )
