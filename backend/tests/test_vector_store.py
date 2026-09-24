from unittest.mock import Mock

import pytest

from app.core.config import settings
from app.models.knowledge_document import KnowledgeDocumentChunk
from app.services.embedding_service import EmbeddingService
from app.services.vector_store import JsonVectorStore, PGVectorStore, VectorStoreFactory


def test_vector_configuration_defaults_to_json():
    assert settings.VECTOR_STORE == "json"
    assert settings.VECTOR_DIMENSION == 128
    assert settings.VECTOR_SIMILARITY_METRIC == "cosine"
    assert settings.VECTOR_TOP_K == 5
    assert settings.VECTOR_MIN_SIMILARITY == 0.2


def test_embedding_vector_round_trip():
    service = EmbeddingService()
    vector = service.generate_embedding("production knowledge search")
    serialized = service.serialize_vector(vector)

    assert service.deserialize_vector(serialized) == vector
    assert len(vector) == settings.VECTOR_DIMENSION


def test_json_store_preserves_existing_embedding_behavior():
    service = EmbeddingService()
    store = JsonVectorStore(embedding_service=service)
    chunk = KnowledgeDocumentChunk(content="JSON fallback content")
    db = Mock()
    vector = service.generate_embedding(chunk.content)

    store.store_embedding(db, chunk, vector)

    assert chunk.embedding_vector_json is not None
    assert service.deserialize_vector(chunk.embedding_vector_json) == vector
    assert chunk.embedding_vector is None
    db.commit.assert_called_once()


def test_vector_store_factory_keeps_json_default(monkeypatch):
    monkeypatch.setattr(settings, "VECTOR_STORE", "json")
    assert isinstance(VectorStoreFactory.create(), JsonVectorStore)


def test_pgvector_availability_is_safe_when_unavailable():
    available = PGVectorStore.is_available()
    assert isinstance(available, bool)
    if not available:
        assert isinstance(VectorStoreFactory.create(), JsonVectorStore)


def test_pgvector_storage_preserves_json_vector(monkeypatch):
    monkeypatch.setattr(PGVectorStore, "is_available", staticmethod(lambda: True))
    service = EmbeddingService()
    store = PGVectorStore(embedding_service=service)
    chunk = KnowledgeDocumentChunk(content="pgvector content")
    db = Mock()
    vector = service.generate_embedding(chunk.content)

    store.store_embedding(db, chunk, vector)

    assert chunk.embedding_vector == vector
    assert service.deserialize_vector(chunk.embedding_vector_json) == vector
    db.add.assert_called_once_with(chunk)


def test_pgvector_search_reports_unavailable_backend():
    if PGVectorStore.is_available():
        pytest.skip("Requires an unavailable pgvector backend")

    with pytest.raises(RuntimeError, match="pgvector is not available"):
        PGVectorStore().search_user_chunks(Mock(), "user-id", "query")
