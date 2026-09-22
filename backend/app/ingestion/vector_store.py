import json
import logging
from typing import List, Dict, Any, Optional
import numpy as np
from sqlalchemy import create_engine, text
from app.config import settings

logger = logging.getLogger(__name__)

class VectorStore:
    """Interface de stockage vectoriel supportant PostgreSQL + pgvector et mémoire locale."""

    def __init__(self):
        self.engine = None
        self.use_memory = False
        self.memory_store: List[Dict[str, Any]] = []

        try:
            self.engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
            with self.engine.connect() as conn:
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
                conn.execute(text(f"""
                    CREATE TABLE IF NOT EXISTS document_chunks (
                        id VARCHAR(128) PRIMARY KEY,
                        content TEXT NOT NULL,
                        metadata JSONB NOT NULL,
                        embedding vector({settings.VECTOR_DIMENSION}) NOT NULL
                    );
                """))
                # Index HNSW pour recherche haute performance
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_chunks_hnsw 
                    ON document_chunks USING hnsw (embedding vector_cosine_ops);
                """))
                conn.commit()
            logger.info("Successfully connected to PostgreSQL with pgvector enabled.")
        except Exception as e:
            logger.warning(f"PostgreSQL connection failed ({e}). Running in-memory vector store mode.")
            self.use_memory = True

    def insert_chunks(self, chunks: List[Dict[str, Any]], embeddings: List[List[float]]) -> int:
        """Insère des chunks avec leurs embeddings associés."""
        if self.use_memory or not self.engine:
            for chunk, emb in zip(chunks, embeddings):
                self.memory_store.append({
                    "id": chunk["id"],
                    "content": chunk["content"],
                    "metadata": chunk["metadata"],
                    "embedding": np.array(emb, dtype=float)
                })
            return len(chunks)

        with self.engine.begin() as conn:
            for chunk, emb in zip(chunks, embeddings):
                embedding_str = "[" + ",".join(map(str, emb)) + "]"
                conn.execute(
                    text("""
                        INSERT INTO document_chunks (id, content, metadata, embedding)
                        VALUES (:id, :content, :metadata, :embedding)
                        ON CONFLICT (id) DO UPDATE SET 
                            content = EXCLUDED.content,
                            metadata = EXCLUDED.metadata,
                            embedding = EXCLUDED.embedding;
                    """),
                    {
                        "id": chunk["id"],
                        "content": chunk["content"],
                        "metadata": json.dumps(chunk["metadata"]),
                        "embedding": embedding_str
                    }
                )
        return len(chunks)

    def search_similar(
        self,
        query_embedding: List[float],
        top_k: int = 4,
        similarity_threshold: float = 0.4
    ) -> List[Dict[str, Any]]:
        """Recherche les chunks les plus proches par similarité cosinus."""
        if self.use_memory or not self.engine:
            if not self.memory_store:
                return []
            q_vec = np.array(query_embedding, dtype=float)
            q_norm = np.linalg.norm(q_vec)
            if q_norm == 0:
                q_norm = 1.0

            results = []
            for item in self.memory_store:
                d_vec = item["embedding"]
                d_norm = np.linalg.norm(d_vec)
                if d_norm == 0:
                    d_norm = 1.0
                cosine_sim = float(np.dot(q_vec, d_vec) / (q_norm * d_norm))
                if cosine_sim >= similarity_threshold:
                    results.append({
                        "id": item["id"],
                        "content": item["content"],
                        "metadata": item["metadata"],
                        "similarity_score": round(cosine_sim, 4)
                    })
            results.sort(key=lambda x: x["similarity_score"], reverse=True)
            return results[:top_k]

        embedding_str = "[" + ",".join(map(str, query_embedding)) + "]"
        with self.engine.connect() as conn:
            query = text("""
                SELECT 
                    id, 
                    content, 
                    metadata, 
                    1 - (embedding <=> :embedding) as similarity_score
                FROM document_chunks
                WHERE 1 - (embedding <=> :embedding) >= :threshold
                ORDER BY similarity_score DESC
                LIMIT :limit;
            """)
            rows = conn.execute(query, {
                "embedding": embedding_str,
                "threshold": similarity_threshold,
                "limit": top_k
            }).fetchall()

            return [
                {
                    "id": r[0],
                    "content": r[1],
                    "metadata": json.loads(r[2]) if isinstance(r[2], str) else r[2],
                    "similarity_score": round(float(r[3]), 4)
                }
                for r in rows
            ]

    def count_chunks(self) -> int:
        if self.use_memory or not self.engine:
            return len(self.memory_store)
        with self.engine.connect() as conn:
            res = conn.execute(text("SELECT COUNT(*) FROM document_chunks;")).scalar()
            return res or 0


vector_store = VectorStore()
