import os
import shutil
import tempfile
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from app.ingestion.loader import DocumentLoader
from app.ingestion.chunker import TextChunker
from app.ingestion.vector_store import vector_store
from app.core.bedrock_client import bedrock_client

router = APIRouter(prefix="/api/ingest", tags=["Document Ingestion"])

chunker = TextChunker(chunk_size=600, chunk_overlap=100)

class IngestTextRequest(BaseModel):
    title: str
    content: str
    metadata: Dict[str, Any] = {}

class IngestResponse(BaseModel):
    status: str
    document_name: str
    chunks_created: int
    total_indexed_chunks: int

@router.post("/file", response_model=IngestResponse)
async def ingest_file(file: UploadFile = File(...)):
    """Upload et indexation automatique d'un fichier (PDF, Markdown, TXT)."""
    suffix = os.path.splitext(file.filename)[1].lower()
    if suffix not in [".pdf", ".md", ".txt", ".markdown"]:
        raise HTTPException(status_code=400, detail="Format non supporté. Utilisez PDF, Markdown ou TXT.")

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        # 1. Extraction
        docs = DocumentLoader.load_file(tmp_path)
        for d in docs:
            d["metadata"]["source"] = file.filename

        # 2. Chunking
        chunks = chunker.chunk_documents(docs)

        # 3. Vectorisation via Titan Embeddings
        embeddings = []
        for c in chunks:
            emb = bedrock_client.get_embedding(c["content"])
            embeddings.append(emb)

        # 4. Stockage pgvector
        inserted = vector_store.insert_chunks(chunks, embeddings)
        total_count = vector_store.count_chunks()

        return {
            "status": "success",
            "document_name": file.filename,
            "chunks_created": inserted,
            "total_indexed_chunks": total_count
        }
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

@router.post("/text", response_model=IngestResponse)
async def ingest_text(payload: IngestTextRequest):
    """Indexation directe de texte brut avec métadonnées."""
    docs = [{
        "content": payload.content,
        "metadata": {"source": payload.title, "page": 1, **payload.metadata}
    }]
    chunks = chunker.chunk_documents(docs)
    embeddings = [bedrock_client.get_embedding(c["content"]) for c in chunks]
    inserted = vector_store.insert_chunks(chunks, embeddings)
    total_count = vector_store.count_chunks()

    return {
        "status": "success",
        "document_name": payload.title,
        "chunks_created": inserted,
        "total_indexed_chunks": total_count
    }
