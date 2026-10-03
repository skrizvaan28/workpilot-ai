import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import main as app_main
from app.core.config import Settings
from app.core.security import create_access_token
from app.db import session as db_session
from app.db.base import Base
from app.db.session import get_db
from app.models.knowledge_document import KnowledgeDocumentChunk
from app.services.embedding_service import EmbeddingService

app = app_main.app

SQLALCHEMY_DATABASE_URL = "sqlite://"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


db_session.engine = engine
db_session.SessionLocal = TestingSessionLocal
app_main.engine = engine
Base.metadata.create_all(bind=engine)
app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_database():
    # Keep this module's API dependency and direct chunk assertions on the
    # same in-memory database when the full suite imports multiple test apps.
    db_session.engine = engine
    db_session.SessionLocal = TestingSessionLocal
    app_main.engine = engine
    app.dependency_overrides[get_db] = override_get_db
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def register_user(email: str):
    response = client.post(
        "/api/auth/register",
        json={
            "full_name": "Task Copilot User",
            "email": email,
            "password": "Password123",
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


def login_user(email: str):
    response = client.post(
        "/api/auth/login",
        json={"email": email, "password": "Password123"},
    )
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


def create_task(token: str, *, title: str, description: str, priority: str = "medium", due_date: str | None = None):
    response = client.post(
        "/api/tasks",
        json={
            "title": title,
            "description": description,
            "priority": priority,
            "due_date": due_date,
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 201, response.text
    return response.json()


def create_knowledge_document(token: str, *, title: str, filename: str, content: str):
    response = client.post(
        "/api/knowledge-documents",
        json={
            "title": title,
            "filename": filename,
            "document_type": "policy",
            "content": content,
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 201, response.text
    return response.json()


def set_chunk_embedding(document_id: str, *, content: str, status: str = "ready", model: str = "local-fallback-v1"):
    service = EmbeddingService(model=model)
    vector = service.generate_embedding(content)
    db = TestingSessionLocal()
    try:
        chunk = db.query(KnowledgeDocumentChunk).filter_by(document_id=document_id, chunk_index=0).first()
        assert chunk is not None
        chunk.embedding_status = status
        chunk.embedding_model = model
        chunk.embedding_vector_json = service.serialize_vector(vector)
        db.commit()
    finally:
        db.close()


def test_task_copilot_requires_authentication():
    email = "copilot-auth@example.com"
    register_user(email)
    token = login_user(email)
    task = create_task(token, title="Prepare launch", description="Prepare launch checklist")
    response = client.post(f"/api/ai/tasks/{task['id']}/copilot", json={"action": "breakdown"})
    assert response.status_code == 401


def test_task_copilot_rejects_other_users_task():
    owner_email = "copilot-owner@example.com"
    other_email = "copilot-other@example.com"
    register_user(owner_email)
    register_user(other_email)
    owner_token = login_user(owner_email)
    other_token = login_user(other_email)

    task = create_task(owner_token, title="Quarterly review", description="Create final review summary")

    response = client.post(
        f"/api/ai/tasks/{task['id']}/copilot",
        json={"action": "breakdown"},
        headers={"Authorization": f"Bearer {other_token}"},
    )
    assert response.status_code == 404, response.text


def test_task_copilot_breakdown_response():
    email = "copilot-breakdown@example.com"
    register_user(email)
    token = login_user(email)
    task = create_task(
        token,
        title="Prepare onboarding rollout",
        description="Coordinate onboarding for the new team and finalize schedule, documentation, and handoff requirements.",
        priority="high",
    )

    response = client.post(
        f"/api/ai/tasks/{task['id']}/copilot",
        json={"action": "breakdown", "question": "Break this task into smaller actionable steps."},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["answer"]
    assert isinstance(payload["suggested_steps"], list) and payload["suggested_steps"]
    assert payload["recommended_priority"] in {"high", "medium", "low"}


def test_task_copilot_checklist_response():
    email = "copilot-checklist@example.com"
    register_user(email)
    token = login_user(email)
    task = create_task(
        token,
        title="Finalize launch checklist",
        description="Confirm dependencies for the launch and prepare final sign-off.",
        priority="medium",
    )

    response = client.post(
        f"/api/ai/tasks/{task['id']}/copilot",
        json={"action": "checklist", "question": "Create a checklist for this task."},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200, response.text
    payload = response.json()
    assert isinstance(payload["checklist"], list) and payload["checklist"]
    assert payload["answer"]


def test_task_copilot_reports_no_knowledge_context():
    email = "copilot-knowledge-empty@example.com"
    register_user(email)
    token = login_user(email)
    task = create_task(token, title="Employee onboarding", description="Finish the onboarding flow for new hires.")

    response = client.post(
        f"/api/ai/tasks/{task['id']}/copilot",
        json={"action": "knowledge_context", "question": "What is the secret employee policy?"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["knowledge_context_found"] is False
    assert payload["knowledge_sources"] == []
    assert "I couldn't find enough information" in payload["answer"]


def test_task_copilot_uses_user_knowledge_sources_when_relevant():
    email = "copilot-knowledge-found@example.com"
    register_user(email)
    token = login_user(email)
    task = create_task(token, title="Prepare onboarding", description="Collect HR intake items for employee onboarding.")

    document = create_knowledge_document(
        token,
        title="Leave Policy",
        filename="leave-policy.txt",
        content="Our company leave policy allows 20 days of annual vacation. Employees may also take sick leave and parental leave.",
    )
    set_chunk_embedding(document["id"], content=document["content"])

    response = client.post(
        f"/api/ai/tasks/{task['id']}/copilot",
        json={"action": "knowledge_context", "question": "What is the company leave policy?"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["knowledge_context_found"] is True
    assert payload["knowledge_sources"]
    assert payload["knowledge_sources"][0]["document_id"] == document["id"]
    assert "20" in payload["answer"] or "annual vacation" in payload["answer"].lower()


def test_task_copilot_missing_task_returns_not_found():
    email = "copilot-missing@example.com"
    register_user(email)
    token = login_user(email)

    response = client.post(
        "/api/ai/tasks/does-not-exist/copilot",
        json={"action": "breakdown"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 404, response.text


def test_productivity_copilot_requires_authentication():
    response = client.post("/api/ai/copilot", json={"message": "Show my overdue tasks"})
    assert response.status_code == 401


def test_productivity_copilot_queries_and_creates_user_tasks():
    email = "productivity-copilot@example.com"
    register_user(email)
    token = login_user(email)
    overdue = create_task(token, title="Overdue report", description="", priority="high", due_date="2020-01-01")

    response = client.post(
        "/api/ai/copilot",
        json={"message": "Show my overdue tasks"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200, response.text
    assert response.json()["intent"] == "OVERDUE_TASKS"
    assert [task["id"] for task in response.json()["tasks"]] == [overdue["id"]]

    response = client.post(
        "/api/ai/copilot",
        json={"message": "Create a high priority task called Finish project report due tomorrow"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200, response.text
    created = response.json()["task"]
    assert response.json()["intent"] == "CREATE_TASK"
    assert created["title"] == "Finish project report"
    assert created["priority"] == "high"
    assert created["due_date"] is not None


def test_productivity_copilot_workload_isolation():
    first_email = "productivity-first@example.com"
    second_email = "productivity-second@example.com"
    register_user(first_email)
    register_user(second_email)
    first_token = login_user(first_email)
    second_token = login_user(second_email)
    first_task = create_task(first_token, title="First user's task", description="Owned by first user", priority="high")
    create_task(second_token, title="Second user's task", description="Owned by second user")

    response = client.post(
        "/api/ai/copilot",
        json={"message": "Summarize my workload"},
        headers={"Authorization": f"Bearer {first_token}"},
    )
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["workload"]["total_tasks"] == 1
    assert payload["workload"]["high_priority"] == 1
    assert first_task["id"] not in {
        task["id"] for task in client.get("/api/tasks", headers={"Authorization": f"Bearer {second_token}"}).json()
    }


def test_productivity_copilot_uses_user_knowledge_base():
    email = "productivity-knowledge@example.com"
    register_user(email)
    token = login_user(email)
    document = create_knowledge_document(
        token,
        title="Planning Guide",
        filename="planning.txt",
        content="Project planning requires an owner, milestones, and a written acceptance checklist.",
    )
    set_chunk_embedding(document["id"], content=document["content"])

    response = client.post(
        "/api/ai/copilot",
        json={"message": "What documents can help me with project planning?"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["intent"] == "KNOWLEDGE_SEARCH"
    assert payload["knowledge_sources"][0]["document_id"] == document["id"]


def test_productivity_copilot_exact_messages_have_distinct_results():
    email = "productivity-exact-messages@example.com"
    register_user(email)
    token = login_user(email)
    create_task(token, title="Overdue documentation", description="", priority="medium", due_date="2020-01-01")
    create_task(token, title="High priority launch", description="", priority="high")

    headers = {"Authorization": f"Bearer {token}"}
    messages = [
        "Show my overdue tasks",
        "Show my high priority tasks",
        "Summarize my current workload",
        "Create a task called Complete WorkPilot documentation",
        "What should I work on first?",
    ]
    responses = [
        client.post("/api/ai/copilot", json={"message": message}, headers=headers)
        for message in messages
    ]

    assert all(response.status_code == 200 for response in responses)
    payloads = [response.json() for response in responses]
    assert [payload["intent"] for payload in payloads] == [
        "OVERDUE_TASKS",
        "HIGH_PRIORITY_TASKS",
        "WORKLOAD_SUMMARY",
        "CREATE_TASK",
        "PRODUCTIVITY_SUMMARY",
    ]
    assert payloads[0]["tasks"][0]["title"] == "Overdue documentation"
    assert payloads[1]["tasks"][0]["title"] == "High priority launch"
    assert payloads[2]["workload"]["total_tasks"] == 2
    assert payloads[3]["task"]["title"] == "Complete WorkPilot documentation"
    assert "Start with" in payloads[4]["message"]
    assert len({payload["message"] for payload in payloads}) == 5

    print("Exact copilot responses:")
    for message, payload in zip(messages, payloads):
        print(f"{message} -> {payload['intent']}: {payload['message']}")

def test_productivity_copilot_unknown_message_uses_help_only():
    email = "productivity-general-help@example.com"
    register_user(email)
    token = login_user(email)
    response = client.post(
        "/api/ai/copilot",
        json={"message": "Tell me something unrelated"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["intent"] == "GENERAL_HELP"
    assert payload["tasks"] == []
    assert "show overdue" in payload["message"].lower()


def test_productivity_copilot_handles_greetings_and_conversation():
    email = "productivity-conversation@example.com"
    register_user(email)
    token = login_user(email)
    headers = {"Authorization": f"Bearer {token}"}

    for greeting in ("Hi", "Hello", "Good morning"):
        response = client.post("/api/ai/copilot", json={"message": greeting}, headers=headers)
        assert response.status_code == 200, response.text
        payload = response.json()
        assert payload["intent"] == "GREETING"
        assert "task" in payload["message"].lower() or "help" in payload["message"].lower()
        assert payload["tasks"] == []

    conversation_responses = {
        phrase: client.post("/api/ai/copilot", json={"message": phrase}, headers=headers).json()
        for phrase in ("Thanks", "Bye", "What can you do?", "Help me")
    }
    assert conversation_responses["Thanks"]["intent"] == "GENERAL_HELP"
    assert "welcome" in conversation_responses["Thanks"]["message"].lower()
    assert "see you" in conversation_responses["Bye"]["message"].lower()
    assert "create" in conversation_responses["What can you do?"]["message"].lower()
    assert "knowledge" in conversation_responses["Help me"]["message"].lower()


def test_productivity_copilot_prioritizes_actions_over_greetings():
    email = "productivity-mixed-intents@example.com"
    register_user(email)
    token = login_user(email)
    headers = {"Authorization": f"Bearer {token}"}
    create_task(token, title="Overdue mixed command", description="", due_date="2020-01-01")

    overdue_response = client.post(
        "/api/ai/copilot",
        json={"message": "Hi, show my overdue tasks"},
        headers=headers,
    )
    assert overdue_response.status_code == 200, overdue_response.text
    assert overdue_response.json()["intent"] == "OVERDUE_TASKS"

    create_response = client.post(
        "/api/ai/copilot",
        json={"message": "Hey, create a task called Finish report"},
        headers=headers,
    )
    assert create_response.status_code == 200, create_response.text
    assert create_response.json()["intent"] == "CREATE_TASK"
    assert create_response.json()["task"]["title"] == "Finish report"

    productivity_response = client.post(
        "/api/ai/copilot",
        json={"message": "Hello, what should I work on first?"},
        headers=headers,
    )
    assert productivity_response.status_code == 200, productivity_response.text
    assert productivity_response.json()["intent"] == "PRODUCTIVITY_SUMMARY"


def test_agent_reads_updates_and_completes_a_task():
    email = "agent-task-actions@example.com"
    register_user(email)
    token = login_user(email)
    headers = {"Authorization": f"Bearer {token}"}
    created = create_task(token, title="Project report", description="Finish the report")

    details = client.post(
        "/api/ai/copilot",
        json={"message": "Show details of my project report task"},
        headers=headers,
    )
    assert details.json()["intent"] == "GET_TASK_DETAILS"
    assert details.json()["task"]["id"] == created["id"]

    count = client.post(
        "/api/ai/copilot",
        json={"message": "How many tasks do I have?"},
        headers=headers,
    )
    assert count.json()["intent"] == "WORKLOAD_SUMMARY"
    assert count.json()["workload"]["total_tasks"] == 1

    priority = client.post(
        "/api/ai/copilot",
        json={"message": "Change my project report task to high priority"},
        headers=headers,
    )
    assert priority.json()["intent"] == "UPDATE_TASK"
    assert priority.json()["task"]["priority"] == "high"

    progress = client.post(
        "/api/ai/copilot",
        json={"message": "Update the project report task progress to 50 percent"},
        headers=headers,
    )
    assert progress.json()["task"]["progress"] == 50

    status = client.post(
        "/api/ai/copilot",
        json={"message": "Set the project report task to in progress"},
        headers=headers,
    )
    assert status.json()["task"]["status"] == "in_progress"

    completed = client.post(
        "/api/ai/copilot",
        json={"message": "Mark my project report task as completed"},
        headers=headers,
    )
    assert completed.json()["intent"] == "COMPLETE_TASK"
    assert completed.json()["task"]["completed"] is True
    assert completed.json()["task"]["status"] == "completed"
    assert completed.json()["task"]["progress"] == 100


def test_agent_does_not_guess_ambiguous_tasks():
    email = "agent-ambiguous@example.com"
    register_user(email)
    token = login_user(email)
    create_task(token, title="Project report Q1", description="First report")
    create_task(token, title="Project report Q2", description="Second report")

    response = client.post(
        "/api/ai/copilot",
        json={"message": "Complete the project report task"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["success"] is False
    assert "multiple matching tasks" in payload["message"].lower()
    assert payload["task"] is None


def test_agent_cannot_modify_another_users_task():
    owner_email = "agent-owner@example.com"
    other_email = "agent-other@example.com"
    register_user(owner_email)
    register_user(other_email)
    owner_token = login_user(owner_email)
    other_token = login_user(other_email)
    owner_task = create_task(owner_token, title="Private report", description="Owner data", priority="medium")

    response = client.post(
        "/api/ai/copilot",
        json={"message": "Change my private report task to high priority"},
        headers={"Authorization": f"Bearer {other_token}"},
    )
    assert response.status_code == 200, response.text
    assert response.json()["success"] is False
    assert client.get("/api/tasks", headers={"Authorization": f"Bearer {owner_token}"}).json()[0]["id"] == owner_task["id"]
    assert client.get("/api/tasks", headers={"Authorization": f"Bearer {owner_token}"}).json()[0]["priority"] == "medium"


def test_agent_requires_confirmation_for_delete_requests():
    email = "agent-delete-confirmation@example.com"
    register_user(email)
    token = login_user(email)
    task = create_task(token, title="Old report", description="Keep this until confirmed")

    response = client.post(
        "/api/ai/copilot",
        json={"message": "Delete my old report task"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["intent"] == "DELETE_TASK"
    assert payload["requires_confirmation"] is True
    assert payload["confirmation_action"] == "DELETE_TASK"
    assert client.get("/api/tasks", headers={"Authorization": f"Bearer {token}"}).json()[0]["id"] == task["id"]


def test_agent_planning_returns_suggestions_without_mutation():
    email = "agent-planning@example.com"
    register_user(email)
    token = login_user(email)
    create_task(token, title="Project report", description="Gather requirements and test the result", due_date="2020-01-01")

    response = client.post(
        "/api/ai/copilot",
        json={"message": "Help me finish my project report"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["intent"] == "TASK_PLANNING"
    assert payload["suggested_steps"]
    assert payload["tasks"][0]["title"] == "Project report"


def test_authentication_rejects_invalid_and_expired_tokens_without_passwords():
    email = "security-auth@example.com"
    registration = client.post(
        "/api/auth/register",
        json={"full_name": "Security User", "email": email, "password": "Password123"},
    )
    assert registration.status_code == 201, registration.text
    assert "hashed_password" not in registration.json()

    invalid = client.get("/api/users/me", headers={"Authorization": "Bearer invalid-token"})
    assert invalid.status_code == 401

    expired_token = create_access_token(registration.json()["id"], expires_minutes=-1)
    expired = client.get("/api/users/me", headers={"Authorization": f"Bearer {expired_token}"})
    assert expired.status_code == 401

    profile = client.get(
        "/api/users/me",
        headers={"Authorization": f"Bearer {login_user(email)}"},
    )
    assert profile.status_code == 200
    assert "hashed_password" not in profile.json()


def test_task_validation_rejects_invalid_status_and_progress():
    email = "security-validation@example.com"
    register_user(email)
    token = login_user(email)
    response = client.post(
        "/api/tasks",
        json={"title": "Invalid task", "status": "unknown", "progress": 101},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 422
    assert isinstance(response.json()["detail"], list)


def test_task_crud_rejects_other_users_task():
    owner_email = "security-task-owner@example.com"
    other_email = "security-task-other@example.com"
    register_user(owner_email)
    register_user(other_email)
    owner_token = login_user(owner_email)
    other_token = login_user(other_email)
    task = create_task(owner_token, title="Owner task", description="Private")
    other_headers = {"Authorization": f"Bearer {other_token}"}

    update = client.put(
        f"/api/tasks/{task['id']}",
        json={"priority": "high"},
        headers=other_headers,
    )
    complete = client.patch(f"/api/tasks/{task['id']}/complete", headers=other_headers)
    delete = client.delete(f"/api/tasks/{task['id']}", headers=other_headers)
    assert update.status_code == 404
    assert complete.status_code == 404
    assert delete.status_code == 404

    owner_tasks = client.get("/api/tasks", headers={"Authorization": f"Bearer {owner_token}"}).json()
    assert owner_tasks[0]["priority"] == "medium"
    assert owner_tasks[0]["completed"] is False


def test_duplicate_registration_is_a_clean_client_error():
    email = "security-duplicate@example.com"
    register_user(email)
    response = client.post(
        "/api/auth/register",
        json={"full_name": "Duplicate User", "email": email, "password": "Password123"},
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Email is already registered"


def test_production_configuration_rejects_weak_secret_and_wildcard_cors():
    with pytest.raises(ValueError):
        Settings(
            ENVIRONMENT="production",
            DATABASE_URL="postgresql://localhost/workpilot",
            SECRET_KEY="short",
            CORS_ORIGINS="https://workpilot.example.com",
        )

    with pytest.raises(ValueError):
        Settings(
            ENVIRONMENT="production",
            DATABASE_URL="postgresql://localhost/workpilot",
            SECRET_KEY="a" * 48,
            CORS_ORIGINS="*",
        )
