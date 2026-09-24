from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import main as app_main
from app.db import session as db_session
from app.db.base import Base
from app.db.session import get_db

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
            "full_name": "Test User",
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


def test_knowledge_document_flow_and_isolation():
    first_email = "knowledge-first@example.com"
    second_email = "knowledge-second@example.com"

    register_user(first_email)
    register_user(second_email)

    first_token = login_user(first_email)
    second_token = login_user(second_email)

    headers_first = {"Authorization": f"Bearer {first_token}"}
    headers_second = {"Authorization": f"Bearer {second_token}"}

    create_response = client.post(
        "/api/knowledge-documents",
        json={
            "title": "Quarterly Plan",
            "filename": "quarterly-plan.txt",
            "document_type": "policy",
            "content": "Quarterly plan summary\n\n- Launch new feature\n- Review compliance\n- Update onboarding",
        },
        headers=headers_first,
    )
    assert create_response.status_code == 201, create_response.text
    doc = create_response.json()
    assert doc["title"] == "Quarterly Plan"
    assert doc["user_id"]

    list_response = client.get("/api/knowledge-documents", headers=headers_first)
    assert list_response.status_code == 200, list_response.text
    documents = list_response.json()
    assert len(documents) == 1

    get_response = client.get(f"/api/knowledge-documents/{doc['id']}", headers=headers_first)
    assert get_response.status_code == 200, get_response.text
    assert get_response.json()["filename"] == "quarterly-plan.txt"

    chunks_response = client.get(
        f"/api/knowledge-documents/{doc['id']}/chunks",
        headers=headers_first,
    )
    assert chunks_response.status_code == 200, chunks_response.text
    chunks = chunks_response.json().get("chunks", [])
    assert len(chunks) >= 1
    assert any("Launch" in chunk["content"] for chunk in chunks)

    unauthorized_response = client.post(
        "/api/knowledge-documents",
        json={
            "title": "No auth",
            "filename": "secret.txt",
            "document_type": "policy",
            "content": "This should require a token.",
        },
    )
    assert unauthorized_response.status_code == 401, unauthorized_response.text

    second_user_response = client.get(
        f"/api/knowledge-documents/{doc['id']}",
        headers=headers_second,
    )
    assert second_user_response.status_code == 403, second_user_response.text

    delete_response = client.delete(
        f"/api/knowledge-documents/{doc['id']}",
        headers=headers_first,
    )
    assert delete_response.status_code == 204, delete_response.text


def test_document_chunking_service_result():
    from app.services.document_processing_service import chunk_text

    text = "Sentence one. Sentence two. Sentence three. " * 12
    chunks = chunk_text(text, chunk_size=50, overlap=10)
    assert len(chunks) >= 2
    assert all(chunk["chunk_index"] >= 0 for chunk in chunks)
    assert all(len(chunk["content"]) <= 50 + 10 for chunk in chunks)


def test_embedding_service_fallback_contract():
    from app.services.embedding_service import EmbeddingService

    service = EmbeddingService()
    vector = service.generate_embedding("Quarterly plan summary")

    assert isinstance(vector, list)
    assert len(vector) > 0
    assert all(isinstance(value, float) for value in vector)

    serialized = service.serialize_vector(vector)
    restored = service.deserialize_vector(serialized)
    assert len(restored) == len(vector)
    assert restored == vector
