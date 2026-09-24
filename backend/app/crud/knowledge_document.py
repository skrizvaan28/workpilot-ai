from sqlalchemy.orm import Session

from app.models.knowledge_document import KnowledgeDocument, KnowledgeDocumentChunk
from app.schemas.knowledge_document import KnowledgeDocumentCreate
from app.services.document_processing_service import chunk_text
from app.services.embedding_service import EmbeddingService


def list_knowledge_documents(db: Session, user_id: str) -> list[KnowledgeDocument]:
    return (
        db.query(KnowledgeDocument)
        .filter(KnowledgeDocument.user_id == user_id)
        .order_by(KnowledgeDocument.created_at.desc())
        .all()
    )


def get_knowledge_document(db: Session, user_id: str, document_id: str) -> KnowledgeDocument | None:
    return (
        db.query(KnowledgeDocument)
        .filter(KnowledgeDocument.id == document_id, KnowledgeDocument.user_id == user_id)
        .first()
    )


def create_knowledge_document(
    db: Session,
    user_id: str,
    document_in: KnowledgeDocumentCreate,
) -> KnowledgeDocument:
    document = KnowledgeDocument(
        user_id=user_id,
        title=document_in.title.strip(),
        filename=document_in.filename.strip(),
        document_type=document_in.document_type.strip() or "notes",
        content=document_in.content,
    )
    db.add(document)
    db.commit()
    db.refresh(document)

    chunk_items = chunk_text(document.content)
    embedding_service = EmbeddingService()
    for chunk in chunk_items:
        content = chunk["content"]
        embedding_vector = embedding_service.generate_embedding(content)
        db.add(
            KnowledgeDocumentChunk(
                document_id=document.id,
                chunk_index=chunk["chunk_index"],
                content=content,
                char_count=chunk["char_count"],
                token_estimate=chunk["token_estimate"],
                embedding_status="ready",
                embedding_model=embedding_service.model,
                embedding_vector_json=embedding_service.serialize_vector(embedding_vector),
            )
        )
    db.commit()
    db.refresh(document)
    return document


def delete_knowledge_document(db: Session, user_id: str, document_id: str) -> bool:
    db_document = get_knowledge_document(db, user_id, document_id)
    if db_document is None:
        return False
    db.delete(db_document)
    db.commit()
    return True


def get_document_chunks(db: Session, user_id: str, document_id: str) -> list[KnowledgeDocumentChunk]:
    document = get_knowledge_document(db, user_id, document_id)
    if document is None:
        return []
    return (
        db.query(KnowledgeDocumentChunk)
        .filter(KnowledgeDocumentChunk.document_id == document_id)
        .order_by(KnowledgeDocumentChunk.chunk_index.asc())
        .all()
    )
