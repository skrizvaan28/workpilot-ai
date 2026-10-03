import pytest
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


@pytest.fixture(autouse=True)
def reset_database():
    # Other test modules configure the shared FastAPI app with their own
    # in-memory database at import time. Restore this module's engine before
    # each test so API writes and direct chunk assertions use the same store.
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
            "full_name": "Search User",
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


def create_document(token: str, *, title: str, content: str, filename: str = "doc.txt"):
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


def set_chunk_embedding(document_id: str, chunk_index: int, *, content: str, status: str = "ready", model: str = "local-fallback-v1"):
    service = EmbeddingService(model=model)
    vector = service.generate_embedding(content)
    db = TestingSessionLocal()
    try:
        chunk = db.query(KnowledgeDocumentChunk).filter_by(document_id=document_id, chunk_index=chunk_index).first()
        assert chunk is not None
        chunk.embedding_status = status
        chunk.embedding_model = model
        chunk.embedding_vector_json = service.serialize_vector(vector)
        db.commit()
    finally:
        db.close()


def set_document_chunks_embedding(document_id: str, *, status: str = "ready", model: str = "local-fallback-v1", invalid_json: bool = False):
    db = TestingSessionLocal()
    try:
        chunks = db.query(KnowledgeDocumentChunk).filter_by(document_id=document_id).all()
        if not chunks:
            return
        service = EmbeddingService(model=model)
        for chunk in chunks:
            chunk.embedding_status = status
            chunk.embedding_model = model
            if invalid_json:
                chunk.embedding_vector_json = "{not-valid-json}"
            else:
                chunk.embedding_vector_json = service.serialize_vector(service.generate_embedding(chunk.content))
        db.commit()
    finally:
        db.close()


def test_authenticated_semantic_search_returns_ranked_results():
    email = "search-auth@example.com"
    register_user(email)
    token = login_user(email)

    doc = create_document(
        token,
        title="Leave Policy",
        filename="leave-policy.txt",
        content="Our company leave policy allows 20 days of annual vacation. Employees may also take sick leave and parental leave.",
    )
    set_chunk_embedding(doc["id"], 0, content="Our company leave policy allows 20 days of annual vacation. Employees may also take sick leave and parental leave.")

    response = client.post(
        "/api/knowledge-documents/search",
        json={"query": "What is our company leave policy?", "top_k": 5},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["query"] == "What is our company leave policy?"
    assert payload["results"][0]["document_id"] == doc["id"]
    assert payload["results"][0]["title"] == "Leave Policy"
    assert payload["results"][0]["filename"] == "leave-policy.txt"
    assert payload["results"][0]["chunk_index"] == 0
    assert "leave policy".lower() in payload["results"][0]["content"].lower()
    assert payload["results"][0]["embedding_model"] == "local-fallback-v1"


def test_semantic_search_requires_authentication():
    response = client.post(
        "/api/knowledge-documents/search",
        json={"query": "What is the leave policy?"},
    )
    assert response.status_code == 401, response.text


def test_semantic_search_isolated_to_user():
    first_email = "search-user-1@example.com"
    second_email = "search-user-2@example.com"
    register_user(first_email)
    register_user(second_email)
    first_token = login_user(first_email)
    second_token = login_user(second_email)

    first_doc = create_document(first_token, title="Private Policy", filename="private.txt", content="Only the first user should see this leave policy document.")
    second_doc = create_document(second_token, title="Other Policy", filename="other.txt", content="Only the second user should see this unrelated leave policy document.")

    set_chunk_embedding(first_doc["id"], 0, content="Only the first user should see this leave policy document.")
    set_chunk_embedding(second_doc["id"], 0, content="Only the second user should see this unrelated leave policy document.")

    response = client.post(
        "/api/knowledge-documents/search",
        json={"query": "leave policy"},
        headers={"Authorization": f"Bearer {first_token}"},
    )

    assert response.status_code == 200, response.text
    results = response.json()["results"]
    assert all(item["document_id"] != second_doc["id"] for item in results)
    assert any(item["document_id"] == first_doc["id"] for item in results)


def test_semantic_search_validates_empty_query_and_top_k():
    email = "search-validation@example.com"
    register_user(email)
    token = login_user(email)

    empty_response = client.post(
        "/api/knowledge-documents/search",
        json={"query": "   ", "top_k": 2},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert empty_response.status_code == 422, empty_response.text

    high_top_k = client.post(
        "/api/knowledge-documents/search",
        json={"query": "leave policy", "top_k": 99},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert high_top_k.status_code == 422, high_top_k.text


def test_ready_embeddings_are_searchable_and_non_ready_are_ignored():
    email = "search-embeddings@example.com"
    register_user(email)
    token = login_user(email)

    doc = create_document(token, title="Travel Policy", filename="travel.txt", content="Travel policy covers hotel reimbursement and expense approval.")
    set_chunk_embedding(doc["id"], 0, content="Travel policy covers hotel reimbursement and expense approval.", status="ready")

    ignored_doc = create_document(token, title="Pending Policy", filename="pending.txt", content="Travel policy covers hotel reimbursement and expense approval.")
    set_document_chunks_embedding(ignored_doc["id"], status="pending")

    response = client.post(
        "/api/knowledge-documents/search",
        json={"query": "travel reimbursement", "top_k": 5},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200, response.text
    payload = response.json()
    ids = [result["document_id"] for result in payload["results"]]
    assert doc["id"] in ids
    assert ignored_doc["id"] not in ids


def test_cosine_similarity_ranking_prefers_closer_match():
    email = "search-ranking@example.com"
    register_user(email)
    token = login_user(email)

    strong_doc = create_document(token, title="Leave Policy", filename="strong.txt", content="Our company leave policy provides paid annual leave and family leave.")
    weak_doc = create_document(token, title="Security Policy", filename="weak.txt", content="Security policy covers lock codes and access approvals for offices.")

    set_chunk_embedding(strong_doc["id"], 0, content="Our company leave policy provides paid annual leave and family leave.")
    set_chunk_embedding(weak_doc["id"], 0, content="Security policy covers lock codes and access approvals for offices.")

    response = client.post(
        "/api/knowledge-documents/search",
        json={"query": "company leave policy annual vacation", "top_k": 5},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200, response.text
    results = response.json()["results"]
    assert results[0]["document_id"] == strong_doc["id"]
    assert results[0]["similarity"] >= results[1]["similarity"]


def test_invalid_embedding_json_does_not_crash_the_api():
    email = "search-invalid-json@example.com"
    register_user(email)
    token = login_user(email)

    doc = create_document(token, title="Broken Vector", filename="broken.txt", content="This chunk has invalid embedding JSON.")
    set_document_chunks_embedding(doc["id"], status="ready", invalid_json=True)

    response = client.post(
        "/api/knowledge-documents/search",
        json={"query": "invalid embedding json", "top_k": 5},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200, response.text
    assert isinstance(response.json()["results"], list)
    assert all(item["document_id"] != doc["id"] for item in response.json()["results"])


def test_semantic_search_returns_empty_results_when_no_match_found():
    email = "search-empty@example.com"
    register_user(email)
    token = login_user(email)

    doc = create_document(token, title="Quarterly Plan", filename="plan.txt", content="We will launch a new analytics dashboard for enterprise customers.")
    set_chunk_embedding(doc["id"], 0, content="We will launch a new analytics dashboard for enterprise customers.")

    response = client.post(
        "/api/knowledge-documents/search",
        json={"query": "quantum lunar bicycle cathedral aurora retrograde", "top_k": 5},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200, response.text
    assert response.json()["results"] == []


def test_knowledge_question_answer_is_grounded_in_user_documents():
    email = "knowledge-rag@example.com"
    register_user(email)
    token = login_user(email)

    doc = create_document(
        token,
        title="Leave Policy",
        filename="leave.txt",
        content="Our company leave policy allows 20 days of annual vacation. Employees may also take sick leave and parental leave.",
    )
    set_chunk_embedding(
        doc["id"],
        0,
        content="Our company leave policy allows 20 days of annual vacation. Employees may also take sick leave and parental leave.",
    )

    response = client.post(
        "/api/knowledge-documents/ask",
        json={"query": "How many days of annual vacation are allowed?", "top_k": 3},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["answer"]
    assert "20" in payload["answer"] or "annual vacation" in payload["answer"].lower()
    assert payload["sources"]
    assert payload["sources"][0]["document_id"] == doc["id"]
    assert payload["sources"][0]["title"] == "Leave Policy"
    assert payload["context_found"] is True
    assert payload["total_sources"] >= 1
    assert payload["top_similarity"] is not None


def test_knowledge_question_answer_reports_missing_context_cleanly():
    email = "knowledge-rag-empty@example.com"
    register_user(email)
    token = login_user(email)

    response = client.post(
        "/api/knowledge-documents/ask",
        json={"query": "What is the secret planet policy?", "top_k": 3},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["context_found"] is False
    assert payload["sources"] == []
    assert payload["total_sources"] == 0
    assert payload["top_similarity"] is None
    assert "I couldn't find enough information" in payload["answer"]


def test_embedding_service_local_fallback_and_batch_embeddings(monkeypatch):
    from app.core.config import settings

    original_provider = settings.EMBEDDING_PROVIDER
    original_model = settings.EMBEDDING_MODEL
    original_key = settings.EMBEDDING_API_KEY
    original_base_url = getattr(settings, "EMBEDDING_BASE_URL", "")
    try:
        settings.EMBEDDING_PROVIDER = "local"
        settings.EMBEDDING_MODEL = "local-fallback-v1"
        settings.EMBEDDING_API_KEY = ""
        settings.EMBEDDING_BASE_URL = "https://api.openai.com/v1"

        service = EmbeddingService()
        vector = service.generate_embedding("hello world")
        batch = service.generate_embeddings(["hello", "world"])

        assert service.provider_name == "local-fallback"
        assert service.model == "local-fallback-v1"
        assert len(vector) == service.dimension
        assert len(batch) == 2
        assert len(batch[0]) == service.dimension
    finally:
        settings.EMBEDDING_PROVIDER = original_provider
        settings.EMBEDDING_MODEL = original_model
        settings.EMBEDDING_API_KEY = original_key
        settings.EMBEDDING_BASE_URL = original_base_url


def test_embedding_service_uses_configured_external_provider(monkeypatch):
    import json
    from app.core.config import settings
    import urllib.request

    original_provider = settings.EMBEDDING_PROVIDER
    original_model = settings.EMBEDDING_MODEL
    original_key = settings.EMBEDDING_API_KEY
    original_base_url = getattr(settings, "EMBEDDING_BASE_URL", "")
    try:
        settings.EMBEDDING_PROVIDER = "openai"
        settings.EMBEDDING_MODEL = "text-embedding-3-small"
        settings.EMBEDDING_API_KEY = "test-secret-key"
        settings.EMBEDDING_BASE_URL = "https://example.com/v1"

        valid_vector = [0.1] * 1536

        class DummyResponse:
            def __enter__(self):
                return self

            def __exit__(self, exc_type, exc_val, exc_tb):
                return False

            def read(self):
                return json.dumps({"data": [{"embedding": valid_vector}]}).encode("utf-8")

        monkeypatch.setattr(urllib.request, "urlopen", lambda *args, **kwargs: DummyResponse())

        service = EmbeddingService()
        vector = service.generate_embedding("hello")

        assert service.provider_name == "openai"
        assert vector == valid_vector
    finally:
        settings.EMBEDDING_PROVIDER = original_provider
        settings.EMBEDDING_MODEL = original_model
        settings.EMBEDDING_API_KEY = original_key
        settings.EMBEDDING_BASE_URL = original_base_url


def test_embedding_service_validates_dimensions_and_hides_api_key(monkeypatch, caplog):
    import logging
    import urllib.error
    from app.core.config import settings

    original_provider = settings.EMBEDDING_PROVIDER
    original_model = settings.EMBEDDING_MODEL
    original_key = settings.EMBEDDING_API_KEY
    original_base_url = getattr(settings, "EMBEDDING_BASE_URL", "")
    try:
        settings.EMBEDDING_PROVIDER = "openai"
        settings.EMBEDDING_MODEL = "text-embedding-3-small"
        settings.EMBEDDING_API_KEY = "super-secret-key"
        settings.EMBEDDING_BASE_URL = "https://example.com/v1"

        with pytest.raises(ValueError, match="dimension"):
            EmbeddingService().validate_embedding([0.1, 0.2], expected_dimension=3)

        def boom(*args, **kwargs):
            raise urllib.error.HTTPError("https://example.com/v1/embeddings", 401, "Unauthorized", hdrs=None, fp=None)

        monkeypatch.setattr("urllib.request.urlopen", boom)
        with caplog.at_level(logging.ERROR):
            with pytest.raises(ValueError, match="Embedding provider") as exc:
                EmbeddingService().generate_embedding("hello world")

        assert "super-secret-key" not in str(exc.value)
        assert "super-secret-key" not in caplog.text
    finally:
        settings.EMBEDDING_PROVIDER = original_provider
        settings.EMBEDDING_MODEL = original_model
        settings.EMBEDDING_API_KEY = original_key
        settings.EMBEDDING_BASE_URL = original_base_url


def test_embedding_service_batch_and_provider_failure_are_handled():
    import json
    from app.core.config import settings
    import urllib.error

    original_provider = settings.EMBEDDING_PROVIDER
    original_model = settings.EMBEDDING_MODEL
    original_key = settings.EMBEDDING_API_KEY
    original_base_url = getattr(settings, "EMBEDDING_BASE_URL", "")
    try:
        settings.EMBEDDING_PROVIDER = "openai"
        settings.EMBEDDING_MODEL = "text-embedding-3-small"
        settings.EMBEDDING_API_KEY = "test-secret-key"
        settings.EMBEDDING_BASE_URL = "https://example.com/v1"

        valid_vector_a = [0.1] * 1536
        valid_vector_b = [0.2] * 1536

        class DummyResponse:
            def __enter__(self):
                return self

            def __exit__(self, exc_type, exc_val, exc_tb):
                return False

            def read(self):
                return json.dumps({"data": [{"embedding": valid_vector_a}, {"embedding": valid_vector_b}]}).encode("utf-8")

        import urllib.request
        urllib.request.urlopen = lambda *args, **kwargs: DummyResponse()

        batch = EmbeddingService().generate_embeddings(["alpha", "beta"])
        assert batch == [valid_vector_a, valid_vector_b]

        def boom(*args, **kwargs):
            raise urllib.error.HTTPError("https://example.com/v1/embeddings", 500, "Server Error", hdrs=None, fp=None)

        urllib.request.urlopen = boom
        with pytest.raises(ValueError, match="Embedding provider"):
            EmbeddingService().generate_embeddings(["alpha"])
    finally:
        settings.EMBEDDING_PROVIDER = original_provider
        settings.EMBEDDING_MODEL = original_model
        settings.EMBEDDING_API_KEY = original_key
        settings.EMBEDDING_BASE_URL = original_base_url


def test_vector_store_factory_defaults_to_json_fallback():
    from app.services.vector_store import JsonVectorStore, VectorStoreFactory

    store = VectorStoreFactory.create()

    assert isinstance(store, JsonVectorStore)
    assert VectorStoreFactory.status() == "json"
