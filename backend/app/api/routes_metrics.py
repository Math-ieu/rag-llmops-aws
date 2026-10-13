from fastapi import APIRouter
from app.config import settings
from app.ingestion.vector_store import vector_store
from app.generation.prompts import PROMPT_VERSION
from app.db.chat_store import chat_store
from app.cache.semantic_cache import semantic_cache

router = APIRouter(prefix="/api/system", tags=["System & Metrics"])

@router.get("/health")
async def healthcheck():
    """Vérification de l'état de santé du service."""
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "aws_region": settings.AWS_REGION,
        "bedrock_llm_model": settings.BEDROCK_LLM_MODEL_ID,
        "bedrock_embedding_model": settings.BEDROCK_EMBEDDING_MODEL_ID,
        "mock_bedrock": settings.MOCK_BEDROCK,
        "prompt_version": PROMPT_VERSION,
        "total_chunks_indexed": vector_store.count_chunks(),
        "vector_store_type": "in-memory" if vector_store.use_memory else "pgvector (PostgreSQL)"
    }

@router.get("/telemetry")
async def get_live_telemetry():
    """Retourne l'ensemble des métriques de télémétrie agrégées en direct depuis PostgreSQL."""
    metrics_summary = chat_store.get_telemetry_metrics()
    cache_stats = semantic_cache.get_stats()
    return {
        **metrics_summary,
        "app_name": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "aws_region": settings.AWS_REGION,
        "bedrock_llm_model": settings.BEDROCK_LLM_MODEL_ID,
        "bedrock_embedding_model": settings.BEDROCK_EMBEDDING_MODEL_ID,
        "prompt_version": PROMPT_VERSION,
        "total_chunks_indexed": vector_store.count_chunks(),
        "total_documents_count": len(vector_store.get_documents()),
        "vector_store_type": "in-memory" if vector_store.use_memory else "pgvector (PostgreSQL)",
        "cache_backend": cache_stats.get("backend", "pgvector")
    }
