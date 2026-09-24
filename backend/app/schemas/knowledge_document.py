from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class KnowledgeDocumentCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    filename: str = Field(min_length=1, max_length=255)
    document_type: str = Field(default="notes", min_length=1, max_length=50)
    content: str = Field(default="", min_length=1, max_length=200000)


class KnowledgeDocumentSearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000)
    top_k: int = Field(default=5, ge=1, le=10)

    @field_validator("query")
    @classmethod
    def validate_query(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Query must not be empty")
        return normalized


class KnowledgeDocumentSearchResult(BaseModel):
    document_id: str
    title: str
    filename: str
    chunk_index: int
    content: str
    similarity: float
    embedding_model: str


class KnowledgeDocumentSearchResponse(BaseModel):
    query: str
    results: list[KnowledgeDocumentSearchResult]


class KnowledgeDocumentAskRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000)
    top_k: int = Field(default=5, ge=1, le=10)

    @field_validator("query")
    @classmethod
    def validate_query(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Query must not be empty")
        return normalized


class KnowledgeDocumentSource(BaseModel):
    document_id: str
    title: str
    filename: str
    chunk_index: int
    content: str
    similarity: float
    embedding_model: str


class KnowledgeDocumentAskResponse(BaseModel):
    query: str
    answer: str
    sources: list[KnowledgeDocumentSource]
    context_found: bool = False
    total_sources: int = 0
    top_similarity: float | None = None


class KnowledgeDocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    title: str
    filename: str
    document_type: str
    content: str
    created_at: datetime
    updated_at: datetime


class KnowledgeDocumentChunkOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    document_id: str
    chunk_index: int
    content: str
    char_count: int
    token_estimate: int
    embedding_status: str
    embedding_model: str | None = None
    created_at: datetime


class KnowledgeDocumentChunksResponse(BaseModel):
    document_id: str
    total_chunks: int
    chunks: list[KnowledgeDocumentChunkOut]
