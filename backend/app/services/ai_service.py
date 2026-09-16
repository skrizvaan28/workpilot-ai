import json
import logging
import re
import urllib.error
import urllib.request
from typing import Any, Literal

from app.core.config import settings
from app.schemas.ai import TaskInsightRequest, TaskInsightResponse

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are WorkPilot AI, an executive productivity and task management neural engine.

Analyze the user's task data strictly and return a single JSON object with these exact keys:
- priority: "HIGH" | "MEDIUM" | "LOW"
- deadline_risk: "HIGH" | "MEDIUM" | "LOW"
- urgency: "HIGH" | "MEDIUM" | "LOW"
- estimated_effort: "Low" | "Medium" | "High"
- completion_status: string describing the progress (e.g. "In Progress (20%)", "Completed", "Pending")
- recommended_action: concrete, specific next action to take
- explanation: short natural-language AI explanation (1-2 sentences) of why this assessment was made

Rules:
- Be concise, direct, and actionable.
- Analyze strictly based on title, description, due date, progress, and urgency.
- Never output markdown formatting outside the JSON object.
"""


def _extract_json_object(text: str) -> dict[str, Any]:
    cleaned = text.strip()
    fenced = re.search(r"```(?:json)?\s*([\s\S]*?)```", cleaned)
    if fenced:
        cleaned = fenced.group(1).strip()
    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise ValueError("LLM response was not JSON")
    parsed = json.loads(cleaned[start : end + 1])
    if not isinstance(parsed, dict):
        raise ValueError("LLM JSON was not an object")
    return parsed


def _normalize_upper_level(value: Any, fallback: Literal["HIGH", "MEDIUM", "LOW"] = "MEDIUM") -> Literal["HIGH", "MEDIUM", "LOW"]:
    text = str(value or "").strip().upper()
    if text in {"HIGH", "MEDIUM", "LOW"}:
        return text  # type: ignore[return-value]
    if text.startswith("HI"):
        return "HIGH"
    if text.startswith("MED"):
        return "MEDIUM"
    if text.startswith("LO"):
        return "LOW"
    return fallback


def _normalize_effort(value: Any, fallback: Literal["Low", "Medium", "High"] = "Medium") -> Literal["Low", "Medium", "High"]:
    text = str(value or "").strip().capitalize()
    if text in {"Low", "Medium", "High"}:
        return text  # type: ignore[return-value]
    return fallback


def _determine_effort(title: str, description: str, category: str) -> Literal["Low", "Medium", "High"]:
    combined = f"{title} {description} {category}".lower()

    # High effort patterns
    high_keywords = [
        "architecture", "architect", "pipeline", "infrastructure", "security", "soc2",
        "compliance", "audit", "migration", "redesign", "framework", "refactor",
        "database", "vector", "integration", "enterprise", "deploy", "scale"
    ]
    for kw in high_keywords:
        if kw in combined:
            return "High"

    # Medium effort patterns
    medium_keywords = [
        "documentation", "document", "docs", "guide", "api", "review", "backlog",
        "convert", "optimize", "analyze", "test", "specs", "feature", "report",
        "dashboard", "onboarding", "prd", "workflow", "model"
    ]
    for kw in medium_keywords:
        if kw in combined:
            return "Medium"

    # Low effort patterns
    low_keywords = [
        "update", "fix", "typo", "email", "slack", "sync", "quick", "checklist",
        "verify", "meeting", "ping", "digest", "clean", "note"
    ]
    for kw in low_keywords:
        if kw in combined:
            return "Low"

    return "Medium"


def _analyze_task_heuristics(task: TaskInsightRequest) -> TaskInsightResponse:
    title = (task.title or "").strip()
    title_lower = title.lower()
    due_raw = (task.due_date or "").strip().lower()
    progress = max(0, min(100, task.progress))
    is_completed = task.completed or task.status.lower() == "completed" or progress == 100
    category_lower = (task.category or "").strip().lower()
    urgency_raw = (task.urgency or "").strip().lower()

    # 1. Completion Status
    if is_completed:
        completion_status = "Completed (100%)"
    elif task.status.lower() == "overdue" or "yesterday" in due_raw:
        completion_status = f"Overdue ({progress}%)"
    elif progress == 0:
        completion_status = "Pending (0%)"
    else:
        completion_status = f"In Progress ({progress}%)"

    # 2. Estimated Effort
    effort = _determine_effort(title, task.description, task.category)

    # 3. Handling Already Completed Tasks
    if is_completed:
        return TaskInsightResponse(
            priority="LOW",
            deadline_risk="LOW",
            urgency="LOW",
            estimated_effort=effort,
            completion_status="Completed (100%)",
            recommended_action="Archive completed task and verify related deliverables.",
            explanation="This task is fully completed and requires no further active intervention.",
            risk_level="low",
            risk_score=0,
            insight="Task completed successfully.",
            reason="All deliverables are marked 100% complete.",
            suggested_priority="low",
            likely_overdue=False,
        )

    # 4. Deadline, Urgency & Risk Analysis
    is_overdue = (
        "yesterday" in due_raw
        or "overdue" in due_raw
        or urgency_raw == "overdue"
        or task.status.lower() == "overdue"
    )
    is_due_today = (
        "today" in due_raw
        or urgency_raw == "due_today"
        or "tonight" in due_raw
        or "hours" in due_raw
    )
    is_due_tomorrow = (
        "tomorrow" in due_raw
        or "1 day" in due_raw
        or "24 hours" in due_raw
    )

    if is_overdue:
        priority: Literal["HIGH", "MEDIUM", "LOW"] = "HIGH"
        deadline_risk: Literal["HIGH", "MEDIUM", "LOW"] = "HIGH"
        urgency: Literal["HIGH", "MEDIUM", "LOW"] = "HIGH"
        risk_score = 95
        likely_overdue = True
        explanation = "This task has passed its scheduled deadline and remains incomplete."
        recommended_action = "Resolve immediate blockers, finalize outstanding work, and notify stakeholders with an updated ETA."

    elif is_due_today:
        urgency = "HIGH"
        priority = "HIGH"
        likely_overdue = progress < 60
        if progress >= 80:
            deadline_risk = "MEDIUM"
            risk_score = 65
            explanation = "This task is due today with strong completion progress; a focused final push will ensure on-time delivery."
            recommended_action = f"Complete the final verification steps and mark '{title}' as complete today."
        else:
            deadline_risk = "HIGH"
            risk_score = 92
            explanation = "This task is due today with significant work remaining, posing immediate delivery risk."
            recommended_action = f"Dedicate immediate focus to '{title}' today and clear active dependencies."

    elif is_due_tomorrow:
        urgency = "HIGH"
        if progress <= 35:
            # Matches user example requirement (Progress <= 35%, due Tomorrow -> HIGH, HIGH, HIGH)
            priority = "HIGH"
            deadline_risk = "HIGH"
            risk_score = 88
            likely_overdue = True
            explanation = "This task has a near deadline and low completion progress, so it should be prioritized today."

            # Contextualized concrete recommendation
            if "documentation" in title_lower or "docs" in title_lower or "documentation" in category_lower:
                recommended_action = "Start the documentation today and complete the API section first."
            elif "audit" in title_lower or "soc2" in title_lower or "compliance" in title_lower:
                recommended_action = "Review the compliance checklist and gather critical audit evidence immediately."
            elif "api" in title_lower or "gateway" in title_lower or "backend" in title_lower:
                recommended_action = "Address core latency bottlenecks and run automated endpoint validation tests."
            elif "prd" in title_lower or "backlog" in title_lower:
                recommended_action = "Break down remaining PRD requirements into executable sprint items today."
            else:
                recommended_action = f"Begin execution on '{title}' today and complete the foundational milestones first."
        elif progress < 75:
            priority = "HIGH" if task.priority.lower() == "high" else "MEDIUM"
            deadline_risk = "MEDIUM"
            risk_score = 60
            likely_overdue = False
            explanation = "This task is due tomorrow with moderate progress; steady pacing is needed to deliver on schedule."
            recommended_action = f"Push forward remaining high-impact work on '{title}' before end of day."
        else:
            priority = "MEDIUM"
            deadline_risk = "LOW"
            risk_score = 30
            likely_overdue = False
            explanation = "This task has strong progress approaching tomorrow's deadline and is tracking smoothly."
            recommended_action = "Perform final quality checks and prepare deliverables for handoff."

    else:
        # Later due dates or upcoming
        likely_overdue = False
        if task.priority.lower() == "high":
            priority = "HIGH"
            deadline_risk = "MEDIUM" if progress < 40 else "LOW"
            urgency = "MEDIUM"
            risk_score = 62 if progress < 40 else 35
            explanation = "This high-priority initiative has sufficient lead time but warrants steady advancement to prevent bottlenecks."
            recommended_action = f"Structure intermediate milestones for '{title}' and review key prerequisites."
        elif progress < 30:
            priority = "MEDIUM"
            deadline_risk = "MEDIUM"
            urgency = "LOW"
            risk_score = 45
            explanation = "This task has adequate runway before the deadline, but initiating early scoping will avoid last-minute compression."
            recommended_action = f"Outline primary requirements for '{title}' and schedule focused execution blocks."
        else:
            priority = "LOW" if task.priority.lower() == "low" else "MEDIUM"
            deadline_risk = "LOW"
            urgency = "LOW"
            risk_score = 20
            explanation = "Progress is tracking well against the scheduled timeline with minimal delivery risk."
            recommended_action = f"Continue standard progress tracking on '{title}'."

    return TaskInsightResponse(
        priority=priority,
        deadline_risk=deadline_risk,
        urgency=urgency,
        estimated_effort=effort,
        completion_status=completion_status,
        recommended_action=recommended_action,
        explanation=explanation,
        risk_level=deadline_risk.lower(),  # type: ignore[arg-type]
        risk_score=risk_score,
        insight=explanation,
        reason=explanation,
        suggested_priority=priority.lower(),  # type: ignore[arg-type]
        likely_overdue=likely_overdue,
    )


def _call_llm(user_payload: dict[str, Any]) -> str:
    api_key = (settings.LLM_API_KEY or "").strip()
    if not api_key:
        raise ValueError("No LLM API key configured")

    body = json.dumps(
        {
            "model": settings.LLM_MODEL,
            "temperature": 0.2,
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": (
                        "Analyze this task and return JSON strictly matching the requested schema:\n"
                        + json.dumps(user_payload, ensure_ascii=True)
                    ),
                },
            ],
        }
    ).encode("utf-8")

    base = settings.LLM_BASE_URL.rstrip("/")
    url = f"{base}/chat/completions"
    request = urllib.request.Request(
        url,
        data=body,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
    )

    with urllib.request.urlopen(request, timeout=20) as response:
        raw = response.read().decode("utf-8")

    payload = json.loads(raw)
    content = payload["choices"][0]["message"]["content"]
    if not isinstance(content, str) or not content.strip():
        raise ValueError("Empty response from LLM")
    return content


def generate_task_insight(task: TaskInsightRequest) -> TaskInsightResponse:
    """
    Analyzes task data across 7 dimensions:
    priority, deadline_risk, urgency, estimated_effort, completion_status,
    recommended_action, and explanation.

    If an external LLM API is configured, uses it. If not configured or if
    the call fails, uses the built-in deterministic contextual reasoning engine.
    """
    user_payload = {
        "title": task.title,
        "description": task.description,
        "priority": task.priority,
        "category": task.category,
        "due_date": task.due_date,
        "progress": task.progress,
        "assignee": task.assignee,
        "urgency": task.urgency,
        "completed": task.completed,
        "status": task.status,
    }

    # If LLM API Key is configured, attempt external model inference
    if (settings.LLM_API_KEY or "").strip():
        try:
            content = _call_llm(user_payload)
            data = _extract_json_object(content)

            priority = _normalize_upper_level(data.get("priority"), "HIGH" if task.priority.lower() == "high" else "MEDIUM")
            deadline_risk = _normalize_upper_level(data.get("deadline_risk"), "MEDIUM")
            urgency = _normalize_upper_level(data.get("urgency"), "MEDIUM")
            effort = _normalize_effort(data.get("estimated_effort"), _determine_effort(task.title, task.description, task.category))
            completion_status = str(data.get("completion_status") or f"In Progress ({task.progress}%)").strip()
            recommended_action = str(data.get("recommended_action") or "Review task and advance critical items.").strip()
            explanation = str(data.get("explanation") or "Task assessed based on timeline and progress metrics.").strip()

            risk_score = 85 if deadline_risk == "HIGH" else (50 if deadline_risk == "MEDIUM" else 20)
            likely_overdue = deadline_risk == "HIGH" and task.progress < 50

            return TaskInsightResponse(
                priority=priority,
                deadline_risk=deadline_risk,
                urgency=urgency,
                estimated_effort=effort,
                completion_status=completion_status,
                recommended_action=recommended_action,
                explanation=explanation,
                risk_level=deadline_risk.lower(),  # type: ignore[arg-type]
                risk_score=risk_score,
                insight=explanation,
                reason=explanation,
                suggested_priority=priority.lower(),  # type: ignore[arg-type]
                likely_overdue=likely_overdue,
            )
        except Exception as err:
            logger.warning(f"External LLM call failed ({err}), using built-in AI Task Insight Engine.")

    # Local AI Task Insight Engine
    return _analyze_task_heuristics(task)
