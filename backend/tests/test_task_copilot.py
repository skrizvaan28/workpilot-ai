from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import main as app_main
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
