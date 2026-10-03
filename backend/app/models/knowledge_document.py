from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import UserDefinedType

from app.core.config import settings
from app.db.base import Base

try:
    from pgvector.sqlalchemy import Vector
except ImportError:
    class Vector(UserDefinedType):
        cache_ok = True

        def __init__(self, dimensions: int):
            self.dimensions = dimensions

        def get_col_spec(self, **_: object) -> str:
            return f"VECTOR({self.dimensions})"


class KnowledgeDocument(Base):
    __tablename__ = "knowledge_documents"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    document_type: Mapped[str] = mapped_column(String(50), nullable=False, default="notes")
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user: Mapped["User"] = relationship("User", back_populates="knowledge_documents")
    chunks: Mapped[list["KnowledgeDocumentChunk"]] = relationship(
        "KnowledgeDocumentChunk",
        back_populates="document",
        cascade="all, delete-orphan",
        order_by="KnowledgeDocumentChunk.chunk_index",
    )


class KnowledgeDocumentChunk(Base):
    __tablename__ = "knowledge_document_chunks"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    document_id: Mapped[str] = mapped_column(
        ForeignKey("knowledge_documents.id"), index=True, nullable=False
    )
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    char_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    token_estimate: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    embedding_status: Mapped[str] = mapped_column(String(30), nullable=False, default="pending")
    embedding_model: Mapped[str | None] = mapped_column(String(120), nullable=True)
    embedding_vector_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    embedding_vector: Mapped[list[float] | None] = mapped_column(
        Vector(settings.VECTOR_DIMENSION), nullable=True, deferred=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    document: Mapped[KnowledgeDocument] = relationship(
        "KnowledgeDocument", back_populates="chunks"
    )
