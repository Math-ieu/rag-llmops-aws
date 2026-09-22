from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from app.generation.rag_pipeline import rag_pipeline

router = APIRouter(prefix="/api/chat", tags=["Chat & RAG Query"])

class ChatMessage(BaseModel):
    role: str
    content: str

class QueryRequest(BaseModel):
    query: str = Field(..., min_length=2, example="Quelles sont les étapes du pipeline RAG ?")
    chat_history: Optional[List[ChatMessage]] = Field(default=[])
    user_id: Optional[str] = "user_demo"
    session_id: Optional[str] = None

class QueryResponse(BaseModel):
    answer: str
    sources: List[Dict[str, Any]]
    trace_id: str
    metrics: Dict[str, Any]

@router.post("/query", response_model=QueryResponse)
async def query_rag(payload: QueryRequest):
    """Effectue une recherche RAG avec génération complète et métriques de télémétrie."""
    try:
        history = [m.dict() for m in payload.chat_history] if payload.chat_history else []
        result = rag_pipeline.run(
            query=payload.query,
            chat_history=history,
            user_id=payload.user_id,
            session_id=payload.session_id
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/stream")
async def query_rag_stream(payload: QueryRequest):
    """Effectue une recherche RAG avec streaming Server-Sent Events (SSE) token par token."""
    try:
        history = [m.dict() for m in payload.chat_history] if payload.chat_history else []
        generator = rag_pipeline.run_stream(
            query=payload.query,
            chat_history=history,
            user_id=payload.user_id,
            session_id=payload.session_id
        )
        return StreamingResponse(generator, media_type="text/event-stream")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
