-- Forward-only migration proposal for the opt-in pgvector backend.
-- Apply this through the project's migration process after review.
-- The application does not execute this file automatically.

CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE knowledge_document_chunks
    ADD COLUMN IF NOT EXISTS embedding_vector vector(128);

CREATE INDEX IF NOT EXISTS ix_knowledge_document_chunks_embedding_vector_cosine
    ON knowledge_document_chunks
    USING hnsw (embedding_vector vector_cosine_ops);