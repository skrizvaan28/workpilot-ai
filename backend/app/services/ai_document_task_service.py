import re
from datetime import date

from app.schemas.ai_document import DocumentTaskResponse, ExtractedTask


_DATE_PATTERN = re.compile(r"\b(20\d{2}-\d{2}-\d{2})\b")
_BULLET_PATTERN = re.compile(r"^\s*(?:[-*•]|\d+[.)])\s+(?P<text>.+?)\s*$")


def _priority_for(text: str) -> str:
    lowered = text.lower()
    if any(word in lowered for word in ("critical", "urgent", "security", "launch", "asap")):
        return "high"
    if any(word in lowered for word in ("important", "deadline", "client", "review")):
        return "medium"
    return "low"


def _effort_for(text: str) -> str:
    lowered = text.lower()
    if len(text) > 140 or any(word in lowered for word in ("migration", "integration", "architecture", "redesign")):
        return "High"
    if len(text) > 65 or any(word in lowered for word in ("implement", "analyze", "document", "workflow")):
        return "Medium"
    return "Low"


def _date_for(text: str) -> date | None:
    match = _DATE_PATTERN.search(text)
    if not match:
        return None
    try:
        return date.fromisoformat(match.group(1))
    except ValueError:
        return None


def extract_tasks(content: str) -> DocumentTaskResponse:
    """Extract task drafts deterministically behind a future provider boundary."""
    cleaned = content.strip()
    if not cleaned:
        return DocumentTaskResponse(tasks=[])

    candidates: list[str] = []
    for line in cleaned.splitlines():
        match = _BULLET_PATTERN.match(line)
        if match:
            candidates.append(match.group("text").strip())

    if not candidates:
        candidates = [part.strip() for part in re.split(r"[.!?]\s+", cleaned) if part.strip()]

    extracted: list[ExtractedTask] = []
    for candidate in candidates[:20]:
        title = re.sub(r"\s+", " ", _DATE_PATTERN.sub("", candidate)).strip(" -:;")
        if len(title) < 3:
            continue
        extracted.append(
            ExtractedTask(
                title=title[:160],
                description=f"Extracted from document: {candidate}"[:2000],
                priority=_priority_for(candidate),
                due_date=_date_for(candidate),
                estimated_effort=_effort_for(candidate),
            )
        )

    return DocumentTaskResponse(tasks=extracted)