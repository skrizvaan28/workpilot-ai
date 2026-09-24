import re
from typing import Any

from sqlalchemy.orm import Session

from app.models.knowledge_document import KnowledgeDocument, KnowledgeDocumentChunk
from app.services.embedding_service import EmbeddingService
from app.services.vector_store import VectorStoreFactory


class KnowledgeSearchService:
    """Vector-based semantic search for user-owned knowledge-document chunks."""

    def __init__(self, embedding_service: EmbeddingService | None = None):
        self.embedding_service = embedding_service or EmbeddingService()
        self.vector_store = VectorStoreFactory.create()
        self.vector_store.embedding_service = self.embedding_service

    @staticmethod
    def _tokenize(text: str) -> set[str]:
        return {token for token in re.findall(r"[a-z0-9]+", (text or "").lower()) if token}

    def get_chunks_for_document(self, document_id: str, db: Session) -> list[dict]:
        chunks = (
            db.query(KnowledgeDocumentChunk)
            .filter(KnowledgeDocumentChunk.document_id == document_id)
            .order_by(KnowledgeDocumentChunk.chunk_index.asc())
            .all()
        )
        return [
            {
                "document_id": chunk.document_id,
                "chunk_index": chunk.chunk_index,
                "content": chunk.content,
                "embedding_status": chunk.embedding_status,
                "embedding_model": chunk.embedding_model,
                "embedding_vector_json": chunk.embedding_vector_json,
            }
            for chunk in chunks
        ]

    def prepare_for_embedding(self, chunks: list[dict]) -> list[dict]:
        return [
            {
                "chunk_index": chunk["chunk_index"],
                "content": chunk["content"],
                "token_estimate": chunk.get("token_estimate", 0),
            }
            for chunk in chunks
        ]

    def search_user_chunks(
        self,
        db: Session,
        user_id: str,
        query: str,
        top_k: int = 5,
    ) -> list[dict[str, Any]]:
        return self.vector_store.search_user_chunks(db, user_id, query, top_k=top_k)
