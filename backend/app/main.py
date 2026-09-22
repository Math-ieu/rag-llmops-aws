import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.routes_query import router as query_router
from app.api.routes_ingest import router as ingest_router
from app.api.routes_feedback import router as feedback_router
from app.api.routes_metrics import router as metrics_router
from app.ingestion.vector_store import vector_store
from app.core.bedrock_client import bedrock_client
from app.ingestion.chunker import TextChunker

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="Production-grade Advanced RAG with Automated Evaluation & Observability on AWS Bedrock",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configuration CORS pour le frontend React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En dev local, permet les requêtes depuis Vite (ex: http://localhost:5173)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Enregistrement des routes
app.include_router(query_router)
app.include_router(ingest_router)
app.include_router(feedback_router)
app.include_router(metrics_router)

@app.on_event("startup")
async def startup_event():
    logger.info(f"Starting {settings.APP_NAME} in [{settings.APP_ENV}] mode.")
    # Pré-population de démonstration si la base est vide
    if vector_store.count_chunks() == 0:
        logger.info("Vector store is empty. Seeding initial LLMOps reference knowledge...")
        seed_doc = """
        Plateforme LLMOps et Architecture RAG de Production sur AWS :
        Le système RAG (Retrieval-Augmented Generation) en entreprise combine une phase d'ingestion documentaire,
        de vectorisation via Amazon Titan Embeddings v2, et de recherche hybride (dense vectorielle et BM25 textuelle).
        Les chunks retenus sont ensuite rerankés avant d'être passés au modèle de fondation Claude 3.5 Sonnet sur Amazon Bedrock.
        La qualité est supervisée en continu grâce à Langfuse (tracing de latence, tokens, coûts en USD et feedback utilisateur)
        et protégée par un Quality Gate d'évaluation automatisée (métriques de fidélité Faithfulness et LLM-as-a-Judge) dans la CI/CD.
        """
        chunker = TextChunker(chunk_size=300, chunk_overlap=50)
        chunks = chunker.chunk_documents([{
            "content": seed_doc.strip(),
            "metadata": {"source": "Architecture_LLMOps_Overview.md", "page": 1}
        }])
        embeddings = [bedrock_client.get_embedding(c["content"]) for c in chunks]
        vector_store.insert_chunks(chunks, embeddings)
        logger.info(f"Seeded {len(chunks)} default chunks into vector store.")

@app.get("/")
async def root():
    return {
        "message": "Bienvenue sur l'API RAG-LLMOps AWS",
        "documentation": "/docs",
        "health": "/api/system/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.API_HOST, port=settings.API_PORT, reload=settings.DEBUG)
