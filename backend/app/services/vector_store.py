import importlib.util
import json
import logging
import math
import re
from abc import ABC, abstractmethod
from typing import Any, Sequence

import psycopg2
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.knowledge_document import KnowledgeDocument, KnowledgeDocumentChunk
from app.services.embedding_service import EmbeddingService

logger = logging.getLogger(__name__)


class VectorStore(ABC):
    def __init__(self, embedding_service: EmbeddingService | None = None):
        self.embedding_service = embedding_service or EmbeddingService()

    @property
    def name(self) -> str:
        return self.__class__.__name__.lower().replace("vectorstore", "")

    @abstractmethod
    def add(
        self,
        db: Session,
        chunk: KnowledgeDocumentChunk,
        embedding_vector: Sequence[float] | None = None,
    ) -> KnowledgeDocumentChunk:
        raise NotImplementedError

    @abstractmethod
    def upsert(
        self,
        db: Session,
        chunk: KnowledgeDocumentChunk,
        embedding_vector: Sequence[float] | None = None,
    ) -> KnowledgeDocumentChunk:
        raise NotImplementedError

    @abstractmethod
    def delete(
        self,
        db: Session,
        *,
        document_id: str | None = None,
        chunk_id: str | None = None,
        user_id: str | None = None,
    ) -> int:
        raise NotImplementedError

    @abstractmethod
    def clear(self, db: Session, user_id: str | None = None) -> int:
        raise NotImplementedError

    @abstractmethod
    def search_user_chunks(
        self,
        db: Session,
        user_id: str,
        query: str,
        top_k: int = 5,
        document_id: str | None = None,
    ) -> list[dict[str, Any]]:
        raise NotImplementedError

    @abstractmethod
    def store_embedding(
        self,
        db: Session,
        chunk: KnowledgeDocumentChunk,
        embedding_vector: list[float],
    ) -> None:
        raise NotImplementedError

    @abstractmethod
    def reindex_valid_chunks(self, db: Session, user_id: str | None = None) -> dict[str, int]:
        raise NotImplementedError


class JsonVectorStore(VectorStore):
    @staticmethod
    def _tokenize(text: str) -> set[str]:
        return {token for token in re.findall(r"[a-z0-9]+", (text or "").lower()) if token}

    def add(
        self,
        db: Session,
        chunk: KnowledgeDocumentChunk,
        embedding_vector: Sequence[float] | None = None,
    ) -> KnowledgeDocumentChunk:
        vector = list(embedding_vector) if embedding_vector is not None else self.embedding_service.generate_embedding(chunk.content)
        self.store_embedding(db, chunk, vector)
        return chunk

    def upsert(
        self,
        db: Session,
        chunk: KnowledgeDocumentChunk,
        embedding_vector: Sequence[float] | None = None,
    ) -> KnowledgeDocumentChunk:
        return self.add(db, chunk, embedding_vector=embedding_vector)

    def delete(
        self,
        db: Session,
        *,
        document_id: str | None = None,
        chunk_id: str | None = None,
        user_id: str | None = None,
    ) -> int:
        query = db.query(KnowledgeDocumentChunk)
        if chunk_id is not None:
            query = query.filter(KnowledgeDocumentChunk.id == chunk_id)
        if document_id is not None:
            query = query.filter(KnowledgeDocumentChunk.document_id == document_id)
        if user_id is not None:
            query = query.join(KnowledgeDocument, KnowledgeDocument.id == KnowledgeDocumentChunk.document_id).filter(
                KnowledgeDocument.user_id == user_id
            )

        matches = query.all()
        if not matches:
            return 0
        for chunk in matches:
            db.delete(chunk)
        db.commit()
        return len(matches)

    def clear(self, db: Session, user_id: str | None = None) -> int:
        query = db.query(KnowledgeDocumentChunk)
        if user_id is not None:
            query = query.join(KnowledgeDocument, KnowledgeDocument.id == KnowledgeDocumentChunk.document_id).filter(
                KnowledgeDocument.user_id == user_id
            )

        chunks = query.all()
        for chunk in chunks:
            chunk.embedding_status = "pending"
            chunk.embedding_model = None
            chunk.embedding_vector_json = None
        db.commit()
        return len(chunks)

    def search_user_chunks(
        self,
        db: Session,
        user_id: str,
        query: str,
        top_k: int = 5,
        document_id: str | None = None,
    ) -> list[dict[str, Any]]:
        query_text = (query or "").strip()
        if not query_text:
            return []

        query_tokens = self._tokenize(query_text)
        query_vector = self.embedding_service.generate_embedding(query_text)
        chunks_query = (
            db.query(KnowledgeDocumentChunk)
            .join(KnowledgeDocument, KnowledgeDocument.id == KnowledgeDocumentChunk.document_id)
            .filter(KnowledgeDocument.user_id == user_id)
            .filter(KnowledgeDocumentChunk.embedding_status == "ready")
            .order_by(KnowledgeDocumentChunk.chunk_index.asc())
        )
        if document_id:
            chunks_query = chunks_query.filter(KnowledgeDocumentChunk.document_id == document_id)

        chunks = chunks_query.all()

        ranked: list[dict[str, Any]] = []
        relevance_threshold = 0.2
        for chunk in chunks:
            raw_vector = chunk.embedding_vector_json
            vector = self.embedding_service.deserialize_vector(raw_vector)
            if not vector or len(vector) != len(query_vector):
                continue

            chunk_tokens = self._tokenize(chunk.content)
            if query_tokens and chunk_tokens and not (query_tokens & chunk_tokens):
                continue

            score = self.embedding_service.cosine_similarity(query_vector, vector)
            if not math.isfinite(score) or score < relevance_threshold:
                continue

            ranked.append(
                {
                    "document_id": chunk.document_id,
                    "title": chunk.document.title,
                    "filename": chunk.document.filename,
                    "chunk_index": chunk.chunk_index,
                    "content": chunk.content,
                    "similarity": float(score),
                    "embedding_model": chunk.embedding_model or self.embedding_service.model,
                }
            )

        ranked.sort(key=lambda item: item["similarity"], reverse=True)
        return ranked[: max(1, min(top_k, 10))]

    def store_embedding(
        self,
        db: Session,
        chunk: KnowledgeDocumentChunk,
        embedding_vector: list[float],
    ) -> None:
        validated = self.embedding_service.validate_embedding(embedding_vector)
        chunk.embedding_vector_json = self.embedding_service.serialize_vector(validated)
        chunk.embedding_status = "ready"
        chunk.embedding_model = self.embedding_service.model
        db.add(chunk)
        db.commit()

    def reindex_valid_chunks(self, db: Session, user_id: str | None = None) -> dict[str, int]:
        query = db.query(KnowledgeDocumentChunk).join(KnowledgeDocument, KnowledgeDocument.id == KnowledgeDocumentChunk.document_id)
        if user_id:
            query = query.filter(KnowledgeDocument.user_id == user_id)

        chunks = query.filter(KnowledgeDocumentChunk.embedding_vector_json.isnot(None)).all()
        processed = 0
        skipped = 0
        for chunk in chunks:
            vector = self.embedding_service.deserialize_vector(chunk.embedding_vector_json)
            if not vector:
                skipped += 1
                continue
            try:
                self.embedding_service.validate_embedding(vector)
                processed += 1
            except ValueError:
                skipped += 1
                continue
        return {"processed": processed, "skipped": skipped}


class PGVectorStore(VectorStore):
    @staticmethod
    def is_available() -> bool:
        if importlib.util.find_spec("pgvector") is None:
            logger.info("pgvector package is not installed; pgvector backend remains unavailable")
            return False

        try:
            conn = psycopg2.connect(settings.DATABASE_URL)
        except Exception as exc:  # pragma: no cover - environment-specific
            logger.info("pgvector backend unavailable: %s", type(exc).__name__)
            return False
        else:
            conn.close()
            return True

    def add(
        self,
        db: Session,
        chunk: KnowledgeDocumentChunk,
        embedding_vector: Sequence[float] | None = None,
    ) -> KnowledgeDocumentChunk:
        raise NotImplementedError("PGVector storage is not enabled until PostgreSQL + pgvector is configured")

    def upsert(
        self,
        db: Session,
        chunk: KnowledgeDocumentChunk,
        embedding_vector: Sequence[float] | None = None,
    ) -> KnowledgeDocumentChunk:
        return self.add(db, chunk, embedding_vector=embedding_vector)

    def delete(
        self,
        db: Session,
        *,
        document_id: str | None = None,
        chunk_id: str | None = None,
        user_id: str | None = None,
    ) -> int:
        raise NotImplementedError("PGVector deletion is not enabled until PostgreSQL + pgvector is configured")

    def clear(self, db: Session, user_id: str | None = None) -> int:
        raise NotImplementedError("PGVector clearing is not enabled until PostgreSQL + pgvector is configured")

    def search_user_chunks(
        self,
        db: Session,
        user_id: str,
        query: str,
        top_k: int = 5,
        document_id: str | None = None,
    ) -> list[dict[str, Any]]:
        if not self.is_available():
            raise RuntimeError("pgvector is not available in the current environment")

        raise NotImplementedError("PGVector retrieval is not enabled until PostgreSQL + pgvector is configured")

    def store_embedding(self, db: Session, chunk: KnowledgeDocumentChunk, embedding_vector: list[float]) -> None:
        if not self.is_available():
            raise RuntimeError("pgvector is not available in the current environment")
        raise NotImplementedError("PGVector storage is not enabled until PostgreSQL + pgvector is configured")

    def reindex_valid_chunks(self, db: Session, user_id: str | None = None) -> dict[str, int]:
        if not self.is_available():
            return {"processed": 0, "skipped": 0}
        return {"processed": 0, "skipped": 0}


class VectorStoreFactory:
    @staticmethod
    def create() -> VectorStore:
        store_name = (settings.VECTOR_STORE or "json").strip().lower()
        if store_name == "pgvector":
            if PGVectorStore.is_available():
                return PGVectorStore()
            logger.warning("VECTOR_STORE=pgvector is configured but pgvector is unavailable; falling back to JSON storage")
        return JsonVectorStore()

    @staticmethod
    def status() -> str:
        store_name = (settings.VECTOR_STORE or "json").strip().lower()
        if store_name == "pgvector" and PGVectorStore.is_available():
            return "pgvector"
        return "json"
