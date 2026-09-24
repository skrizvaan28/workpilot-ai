from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.crud.knowledge_document import (
    create_knowledge_document,
    delete_knowledge_document,
    get_document_chunks,
    get_knowledge_document,
    list_knowledge_documents,
)
from app.db.session import get_db
from app.models.knowledge_document import KnowledgeDocument
from app.models.user import User
from app.schemas.knowledge_document import (
    KnowledgeDocumentAskRequest,
    KnowledgeDocumentAskResponse,
    KnowledgeDocumentChunkOut,
    KnowledgeDocumentChunksResponse,
    KnowledgeDocumentCreate,
    KnowledgeDocumentOut,
    KnowledgeDocumentSearchRequest,
    KnowledgeDocumentSearchResponse,
    KnowledgeDocumentSearchResult,
)
from app.services.knowledge_search_service import KnowledgeSearchService
from app.services.rag_service import KnowledgeRAGService

router = APIRouter(prefix="/knowledge-documents", tags=["knowledge-documents"])


@router.post("", response_model=KnowledgeDocumentOut, status_code=status.HTTP_201_CREATED)
def create_document(
    document_in: KnowledgeDocumentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return create_knowledge_document(db, current_user.id, document_in)


@router.get("", response_model=list[KnowledgeDocumentOut])
def list_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return list_knowledge_documents(db, current_user.id)


@router.post("/search", response_model=KnowledgeDocumentSearchResponse)
def search_documents(
    search_in: KnowledgeDocumentSearchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = KnowledgeSearchService()
    results = service.search_user_chunks(db, current_user.id, search_in.query, top_k=search_in.top_k)
    return KnowledgeDocumentSearchResponse(
        query=search_in.query.strip(),
        results=[
            KnowledgeDocumentSearchResult(
                document_id=result["document_id"],
                title=result["title"],
                filename=result["filename"],
                chunk_index=result["chunk_index"],
                content=result["content"],
                similarity=result["similarity"],
                embedding_model=result["embedding_model"],
            )
            for result in results
        ],
    )


@router.post("/ask", response_model=KnowledgeDocumentAskResponse)
def ask_documents(
    ask_in: KnowledgeDocumentAskRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = KnowledgeRAGService()
    return service.answer_question(db, current_user.id, ask_in.query, top_k=ask_in.top_k)


@router.get("/{document_id}", response_model=KnowledgeDocumentOut)
def get_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    document = db.query(KnowledgeDocument).filter(KnowledgeDocument.id == document_id).first()
    if document is None:
        raise HTTPException(status_code=404, detail="Knowledge document not found")
    if document.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return document


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    document = db.query(KnowledgeDocument).filter(KnowledgeDocument.id == document_id).first()
    if document is None:
        raise HTTPException(status_code=404, detail="Knowledge document not found")
    if document.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    if not delete_knowledge_document(db, current_user.id, document_id):
        raise HTTPException(status_code=404, detail="Knowledge document not found")


@router.get("/{document_id}/chunks", response_model=KnowledgeDocumentChunksResponse)
def get_document_chunks_route(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    document = db.query(KnowledgeDocument).filter(KnowledgeDocument.id == document_id).first()
    if document is None:
        raise HTTPException(status_code=404, detail="Knowledge document not found")
    if document.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    chunks = get_document_chunks(db, current_user.id, document_id)
    if not chunks:
        raise HTTPException(status_code=404, detail="Knowledge document not found")
    return KnowledgeDocumentChunksResponse(
        document_id=document_id,
        total_chunks=len(chunks),
        chunks=[KnowledgeDocumentChunkOut.model_validate(chunk) for chunk in chunks],
    )
