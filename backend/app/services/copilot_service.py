from datetime import date, timedelta
import logging
import re

from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.ai_copilot import (
    CopilotAction,
    CopilotIntent,
    CopilotRequest,
    CopilotResponse,
    CopilotWorkloadSummary,
)
from app.schemas.task import TaskCreate, TaskOut, TaskUpdate
from app.services.ai_agent_service import (
    TaskResolution,
    complete_user_task,
    create_user_task,
    get_user_tasks,
    resolve_user_task,
    update_user_task,
)
from app.services.ai_task_service import analyze_task
from app.services.analytics_service import get_analytics_overview
from app.services.rag_service import KnowledgeRAGService

logger = logging.getLogger(__name__)


HELP_MESSAGE = (
    "I can show overdue or high-priority tasks, create and explain tasks, summarize "
    "your workload or productivity, search your knowledge base, and recommend what to work on next."
)

GREETING_MESSAGES = {
    "hi": "Hi! 👋 I'm your WorkPilot AI Copilot. I can help you manage tasks, check your workload, search your knowledge base, and plan what to work on next. What would you like to do?",
    "hello": "Hello! 👋 I'm your WorkPilot AI Copilot. I can help with tasks, workload, productivity, and knowledge-base questions. What would you like to do?",
    "hey": "Hey! 👋 I'm ready to help. You can ask me about your tasks, workload, knowledge base, or productivity.",
    "hi there": "Hi there! 👋 Ready to help with your WorkPilot tasks and productivity. What would you like to do?",
    "hello there": "Hello there! 👋 Ready to help with your WorkPilot tasks and productivity. What would you like to do?",
    "good morning": "Good morning! 👋 Ready to help you with your WorkPilot tasks. What would you like to work on?",
    "good afternoon": "Good afternoon! 👋 Ready to help you with your WorkPilot tasks. What would you like to work on?",
    "good evening": "Good evening! 👋 Ready to help you with your WorkPilot tasks. What would you like to work on?",
    "how are you": "I'm ready to help you make progress. Ask me about your tasks, workload, productivity, or knowledge base.",
    "hey workpilot": "Hey! 👋 I'm ready to help. You can ask me about your tasks, workload, knowledge base, or productivity.",
    "hello workpilot": "Hello! 👋 I'm ready to help. You can ask me about your tasks, workload, knowledge base, or productivity.",
}


def _normalized_message(message: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9 ]", " ", message.lower())).strip()


def _classify(message: str) -> CopilotIntent:
    text = message.lower()
    if _normalized_message(message) in GREETING_MESSAGES:
        return "GREETING"
    if re.search(r"\b(create|add|make|new)\b.*\btask\b|\btask\b.*\b(create|add)\b", text):
        return "CREATE_TASK"
    if re.search(r"\b(delete|remove|erase)\b.*\b(task|my)\b", text):
        return "DELETE_TASK"
    if re.search(r"\b(mark|complete|finish)\b.*\btask\b|\bcomplete\s+(?:my|the)?\s*[^?]+", text):
        return "COMPLETE_TASK"
    if re.search(r"\b(change|set|update)\b.*\b(?:priority|progress|in progress|pending|completed)\b", text):
        return "UPDATE_TASK"
    if any(term in text for term in ("knowledge base", "knowledge-base", "document", "documents", "policy")):
        return "KNOWLEDGE_SEARCH"
    if any(term in text for term in ("task details", "details of my", "details for my", "show details")):
        return "GET_TASK_DETAILS"
    if any(term in text for term in ("help me finish", "help me complete", "plan my", "make a plan")):
        return "TASK_PLANNING"
    if any(term in text for term in ("productivity summary", "productivity report", "how productive", "what should i work on", "work on first", "where should i start")):
        return "PRODUCTIVITY_SUMMARY"
    if any(term in text for term in ("workload", "how much work", "work load", "how many tasks", "number of tasks", "task count")):
        return "WORKLOAD_SUMMARY"
    if any(term in text for term in ("explain this task", "explain my task", "break down this task")):
        return "TASK_EXPLANATION"
    if any(term in text for term in ("overdue", "past due", "late tasks")):
        return "OVERDUE_TASKS"
    if any(term in text for term in ("high priority", "high-priority", "urgent tasks")):
        return "HIGH_PRIORITY_TASKS"
    if any(term in text for term in ("show my tasks", "list my tasks", "my tasks", "what tasks")):
        return "LIST_TASKS"
    return "GENERAL_HELP"


def _general_conversation_response(message: str) -> str:
    normalized = _normalized_message(message)
    if normalized in {"thanks", "thank you", "thanks workpilot", "thank you workpilot"}:
        return "You're welcome! 😊 Let me know if you need anything else."
    if normalized in {"bye", "goodbye", "see you", "see you later"}:
        return "See you later! 👋"
    if normalized in {"what can you do", "what do you do", "help", "help me"}:
        return HELP_MESSAGE
    return HELP_MESSAGE


def _task_actions(tasks: list[TaskOut]) -> list[CopilotAction]:
    return [
        CopilotAction(type="VIEW_TASK", label="Open task", task_id=task.id)
        for task in tasks[:5]
    ]


def _extract_create_details(message: str) -> tuple[str, str, str, date | None]:
    cleaned = message.strip()
    title_match = re.search(r"\btask\s+(?:called|named|titled)\s+(.+?)(?=\s+(?:with|priority|due|for)\b|$)", cleaned, re.I)
    if not title_match:
        title_match = re.search(r"\b(?:create|add|make)\s+(?:a\s+)?(?:task\s+)?(?:to\s+)?(.+?)(?=\s+(?:with|priority|due|for)\b|$)", cleaned, re.I)
    title = (title_match.group(1) if title_match else "").strip(" .")
    if not title:
        raise ValueError("Please include a task title, for example: Create a task called Prepare the report.")

    priority_match = re.search(r"\b(low|medium|high)\s+priority\b|\bpriority\s*(?:is|of)?\s*(low|medium|high)\b", cleaned, re.I)
    priority = next((value.lower() for value in priority_match.groups() if value), "medium") if priority_match else "medium"
    due_date = None
    if re.search(r"\btomorrow\b", cleaned, re.I):
        due_date = date.today() + timedelta(days=1)
    elif re.search(r"\btoday\b", cleaned, re.I):
        due_date = date.today()
    else:
        date_match = re.search(r"\b(\d{4}-\d{2}-\d{2})\b", cleaned)
        if date_match:
            try:
                due_date = date.fromisoformat(date_match.group(1))
            except ValueError:
                raise ValueError("Please use a valid due date in YYYY-MM-DD format.") from None

    description_match = re.search(r"\b(?:description|details?)\s*[:=]\s*(.+)$", cleaned, re.I)
    description = description_match.group(1).strip() if description_match else ""
    return title[:160], description[:2000], priority, due_date


def _extract_task_reference(message: str, intent: CopilotIntent) -> str:
    patterns = {
        "GET_TASK_DETAILS": r"(?:details\s+(?:of|for)|show\s+details\s+(?:of|for)?)(?:\s+(?:my|the))?\s+(.+)$",
        "UPDATE_TASK": r"(?:change|set|update)\s+(?:my|the)?\s*(.+?)\s+task(?:\s+(?:priority|status|progress))?\s+to\s+(?:high|medium|low)\s+priority$|(?:change|set|update)\s+(?:my|the)?\s*(.+?)\s+task(?:\s+(?:priority|status|progress))?\s+to\s+(?:in\s+progress|pending|completed|\d+\s+percent)$",
        "COMPLETE_TASK": r"(?:mark|complete|finish)\s+(?:my|the)?\s*(.+?)(?:\s+task)?(?:\s+as\s+(?:completed|complete)|\s+complete|\s+done)?$",
    }
    match = re.search(patterns[intent], message.strip(), re.I)
    if not match:
        return ""
    return next((group for group in match.groups() if group), "").strip(" .?")


def _ambiguous_task_response(intent: CopilotIntent, resolution: TaskResolution) -> CopilotResponse:
    candidates = resolution.candidates or []
    names = ", ".join(f"'{task.title}'" for task in candidates)
    action = "COMPLETE_TASK" if intent == "COMPLETE_TASK" else "UPDATE_TASK" if intent == "UPDATE_TASK" else "GET_TASK_DETAILS"
    return CopilotResponse(
        intent=intent,
        action=action,
        success=False,
        message=f"I found multiple matching tasks: {names}. Which one do you mean?",
        tasks=candidates,
    )


def _workload(tasks: list[TaskOut], user: User) -> CopilotWorkloadSummary:
    today = date.today()
    pending_tasks = [task for task in tasks if not task.completed]
    return CopilotWorkloadSummary(
        total_tasks=len(tasks),
        completed=sum(task.completed for task in tasks),
        in_progress=0,
        pending=len(pending_tasks),
        overdue=sum(1 for task in pending_tasks if task.due_date is not None and task.due_date < today),
        high_priority=sum(1 for task in tasks if task.priority == "high"),
    )


def handle_copilot(db: Session, user: User, request: CopilotRequest) -> CopilotResponse:
    message = request.message.strip()
    intent = _classify(message)
    logger.info("Received message: %s", message)
    logger.info("Detected intent: %s", intent)
    tasks = get_user_tasks(user.id)
    today = date.today()
    logger.info("Authenticated user: %s", user.id)

    if intent == "GREETING":
        logger.info("Handler selected: greeting")
        return CopilotResponse(intent=intent, message=GREETING_MESSAGES[_normalized_message(message)])

    if intent == "DELETE_TASK":
        logger.info("Handler selected: confirm_delete_task")
        return CopilotResponse(
            intent=intent,
            action="DELETE_TASK",
            requires_confirmation=True,
            confirmation_action="DELETE_TASK",
            message="Deleting tasks is destructive. Tell me the exact task title and explicitly confirm deletion before I do anything.",
        )

    if intent == "CREATE_TASK":
        logger.info("Handler selected: create_task")
        title, description, priority, due_date = _extract_create_details(message)
        task = create_user_task(user.id, TaskCreate(title=title, description=description, priority=priority, due_date=due_date))
        return CopilotResponse(
            intent=intent,
            action="CREATE_TASK",
            message="Task created successfully.",
            task=task,
            tasks=[task],
            actions=[CopilotAction(type="VIEW_TASK", label="View created task", task_id=task.id)],
            due_date=due_date,
        )

    if intent in {"GET_TASK_DETAILS", "UPDATE_TASK", "COMPLETE_TASK"}:
        action_name = intent
        logger.info("Handler selected: %s", action_name.lower())
        reference = _extract_task_reference(message, intent)
        resolution = resolve_user_task(user.id, reference)
        if resolution.ambiguous:
            return _ambiguous_task_response(intent, resolution)
        if resolution.task is None:
            return CopilotResponse(
                intent=intent,
                action=action_name,
                success=False,
                message=f"I couldn't find a task matching '{reference or 'that description'}'.",
            )
        task = resolution.task

        if intent == "GET_TASK_DETAILS":
            return CopilotResponse(
                intent=intent,
                action="GET_TASK_DETAILS",
                message=f"Here are the details for '{task.title}'.",
                task=task,
                tasks=[task],
                actions=[CopilotAction(type="GET_TASK_DETAILS", label="View task details", task_id=task.id)],
            )

        if intent == "COMPLETE_TASK":
            updated = complete_user_task(user.id, task.id)
            return CopilotResponse(
                intent=intent,
                action="COMPLETE_TASK",
                message=f"Marked '{task.title}' as completed.",
                task=updated,
                tasks=[updated] if updated else [],
                actions=[CopilotAction(type="COMPLETE_TASK", label="Completed task", task_id=task.id)],
            )

        priority_match = re.search(r"\b(low|medium|high)\s+priority\b", message, re.I)
        progress_match = re.search(r"\b(\d{1,3})\s*(?:%|percent)\b", message, re.I)
        status_match = re.search(r"\b(in\s+progress|pending|completed)\b", message, re.I)
        update_values: dict[str, str | int] = {}
        if priority_match:
            update_values["priority"] = priority_match.group(1).lower()
        if progress_match:
            update_values["progress"] = min(100, int(progress_match.group(1)))
        if status_match:
            update_values["status"] = status_match.group(1).lower().replace(" ", "_")
        updated = update_user_task(user.id, task.id, TaskUpdate(**update_values))
        return CopilotResponse(
            intent=intent,
            action="UPDATE_TASK",
            message=f"Updated '{task.title}' successfully.",
            task=updated,
            tasks=[updated] if updated else [],
            actions=[CopilotAction(type="UPDATE_TASK", label="View updated task", task_id=task.id)],
        )

    if intent == "OVERDUE_TASKS":
        logger.info("Handler selected: get_overdue_tasks")
        matches = [task for task in tasks if not task.completed and task.due_date is not None and task.due_date < today]
        return CopilotResponse(intent=intent, action="GET_OVERDUE_TASKS", message=f"You have {len(matches)} overdue task{'s' if len(matches) != 1 else ''}.", tasks=matches, data=matches, actions=_task_actions(matches))

    if intent == "HIGH_PRIORITY_TASKS":
        logger.info("Handler selected: get_high_priority_tasks")
        matches = [task for task in tasks if not task.completed and task.priority == "high"]
        return CopilotResponse(intent=intent, action="GET_HIGH_PRIORITY_TASKS", message=f"You have {len(matches)} open high-priority task{'s' if len(matches) != 1 else ''}.", tasks=matches, data=matches, actions=_task_actions(matches))

    if intent == "LIST_TASKS":
        logger.info("Handler selected: list_tasks")
        matches = [task for task in tasks if not task.completed]
        return CopilotResponse(intent=intent, action="LIST_TASKS", message=f"You have {len(matches)} open task{'s' if len(matches) != 1 else ''}.", tasks=matches, data=matches, actions=_task_actions(matches))

    if intent == "TASK_PLANNING":
        logger.info("Handler selected: task_planning")
        words = {word for word in re.findall(r"[a-z0-9]+", message.lower()) if len(word) > 3}
        related = [task for task in tasks if words.intersection(re.findall(r"[a-z0-9]+", f"{task.title} {task.description}".lower())) and not task.completed]
        overdue_related = [task for task in related if task.due_date is not None and task.due_date < today]
        knowledge_sources: list[dict] = []
        try:
            rag_response = KnowledgeRAGService().answer_question(db, user.id, message, top_k=3)
            knowledge_sources = [source.model_dump() for source in rag_response.sources]
        except Exception:
            logger.info("Knowledge lookup skipped during planning")
        plan = [
            "Review the requirements and expected outcome.",
            "Complete the highest-impact implementation work.",
            "Test the result and prepare the final documentation.",
        ]
        detail = f" You currently have {len(overdue_related)} overdue related task{'s' if len(overdue_related) != 1 else ''}."
        return CopilotResponse(intent=intent, action="TASK_PLANNING", message=f"Here is a suggested plan.{detail}", tasks=related, suggested_steps=plan, knowledge_sources=knowledge_sources, actions=_task_actions(related))

    if intent in {"WORKLOAD_SUMMARY", "PRODUCTIVITY_SUMMARY"}:
        logger.info("Handler selected: get_productivity_summary")
        summary = _workload(tasks, user)
        analytics = get_analytics_overview(tasks, user)
        recommended_task = next((task for task in tasks if not task.completed and task.due_date is not None and task.due_date < today), None)
        if recommended_task is None:
            recommended_task = next((task for task in tasks if not task.completed and task.priority == "high"), None)
        if recommended_task is None:
            recommended_task = next((task for task in tasks if not task.completed), None)
        if intent == "PRODUCTIVITY_SUMMARY" and recommended_task is not None and any(term in message.lower() for term in ("work on", "start")):
            message_text = f"Start with '{recommended_task.title}' because it is the most urgent open task."
        elif intent == "PRODUCTIVITY_SUMMARY":
            message_text = f"You have completed {analytics.completed_tasks} of {analytics.total_tasks} tasks, with a {analytics.completion_rate}% completion rate."
        else:
            message_text = f"Your workload is {summary.total_tasks} tasks total, with {summary.overdue} overdue and {summary.high_priority} high priority."
        actions = [CopilotAction(type="VIEW_ANALYTICS", label="View analytics")]
        if recommended_task is not None and any(term in message.lower() for term in ("work on", "start")):
            actions.insert(0, CopilotAction(type="VIEW_TASK", label="Open recommended task", task_id=recommended_task.id))
        return CopilotResponse(intent=intent, action="GET_PRODUCTIVITY" if intent == "PRODUCTIVITY_SUMMARY" else "GET_WORKLOAD", message=message_text, data=summary.model_dump(), workload=summary, actions=actions)

    if intent == "TASK_EXPLANATION":
        logger.info("Handler selected: explain_task")
        task = next((item for item in tasks if item.title.lower() in message.lower()), None) or next((item for item in tasks if not item.completed), None)
        if task is None:
            return CopilotResponse(intent=intent, success=False, message="I could not find an open task to explain. Create a task or mention its title.")
        analysis = analyze_task(task, user)
        return CopilotResponse(intent=intent, action="EXPLAIN_TASK", message=analysis.summary, task=task, answer=analysis.recommended_next_action, suggested_steps=analysis.suggested_subtasks, actions=[CopilotAction(type="GET_TASK_DETAILS", label="Open task", task_id=task.id)])

    if intent == "KNOWLEDGE_SEARCH":
        logger.info("Handler selected: search_knowledge_base")
        try:
            rag_response = KnowledgeRAGService().answer_question(db, user.id, message, top_k=5)
        except Exception:
            return CopilotResponse(intent=intent, success=False, message="The knowledge base is temporarily unavailable. Please try again shortly.")
        sources = [source.model_dump() for source in rag_response.sources]
        return CopilotResponse(intent=intent, action="SEARCH_KNOWLEDGE", message=rag_response.answer, answer=rag_response.answer, knowledge_sources=sources, actions=[CopilotAction(type="SEARCH_KNOWLEDGE", label="Search knowledge base")])

    logger.info("Handler selected: general_help")
    return CopilotResponse(intent="GENERAL_HELP", message=_general_conversation_response(message), actions=[CopilotAction(type="CREATE_TASK", label="Create a task"), CopilotAction(type="SEARCH_KNOWLEDGE", label="Search knowledge base")])
