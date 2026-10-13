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
        self.documents_store: List[Dict[str, Any]] = []

        try:
            db_url = settings.DATABASE_URL
            if db_url.startswith("postgresql://") and not db_url.startswith("postgresql+"):
                db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)
            self.engine = create_engine(db_url, pool_pre_ping=True)
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
                # Index plein-texte GIN pour recherche lexicale rapide
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_chunks_fts 
                    ON document_chunks USING gin (to_tsvector('simple', content));
                """))
                # Table de suivi de l'historique des documents indexés
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS indexed_documents (
                        id VARCHAR(128) PRIMARY KEY,
                        name VARCHAR(255) NOT NULL UNIQUE,
                        file_type VARCHAR(32) NOT NULL DEFAULT 'text',
                        chunks_count INT NOT NULL DEFAULT 0,
                        file_size_bytes BIGINT DEFAULT 0,
                        status VARCHAR(32) NOT NULL DEFAULT 'indexed',
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                    );
                """))
                # Synchronisation initiale automatique à partir des chunks existants si la table est vide
                conn.execute(text("""
                    INSERT INTO indexed_documents (id, name, file_type, chunks_count, status, created_at)
                    SELECT 
                        md5(metadata->>'source') as id,
                        metadata->>'source' as name,
                        COALESCE(MIN(metadata->>'file_type'), 'text') as file_type,
                        COUNT(*) as chunks_count,
                        'indexed' as status,
                        CURRENT_TIMESTAMP as created_at
                    FROM document_chunks
                    WHERE metadata->>'source' IS NOT NULL
                    GROUP BY metadata->>'source'
                    ON CONFLICT (name) DO UPDATE SET chunks_count = EXCLUDED.chunks_count;
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

    def search_lexical(
        self,
        query: str,
        top_k: int = 8
    ) -> List[Dict[str, Any]]:
        """Recherche plein-texte PostgreSQL via tsvector / ts_rank."""
        if self.use_memory or not self.engine:
            return []
        try:
            with self.engine.connect() as conn:
                sql = text("""
                    SELECT 
                        id, 
                        content, 
                        metadata, 
                        ts_rank_cd(to_tsvector('simple', content), plainto_tsquery('simple', :query)) as rank_score
                    FROM document_chunks
                    WHERE to_tsvector('simple', content) @@ plainto_tsquery('simple', :query)
                    ORDER BY rank_score DESC
                    LIMIT :limit;
                """)
                rows = conn.execute(sql, {
                    "query": query,
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
        except Exception as e:
            logger.warning(f"Full-text search failed ({e}).")
            return []

    def count_chunks(self) -> int:
        if self.use_memory or not self.engine:
            return len(self.memory_store)
        with self.engine.connect() as conn:
            res = conn.execute(text("SELECT COUNT(*) FROM document_chunks;")).scalar()
            return res or 0

    def record_document(
        self,
        name: str,
        file_type: str = "text",
        chunks_count: int = 0,
        file_size_bytes: int = 0,
        status: str = "indexed"
    ) -> None:
        import hashlib
        import time
        doc_id = hashlib.md5(name.encode()).hexdigest()
        now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

        if self.use_memory or not self.engine:
            existing = next((d for d in self.documents_store if d["name"] == name), None)
            if existing:
                existing["chunks_count"] = chunks_count
                existing["file_size_bytes"] = file_size_bytes
                existing["status"] = status
                existing["created_at"] = now_iso
            else:
                self.documents_store.insert(0, {
                    "id": doc_id,
                    "name": name,
                    "file_type": file_type,
                    "chunks_count": chunks_count,
                    "file_size_bytes": file_size_bytes,
                    "status": status,
                    "created_at": now_iso
                })
            return

        with self.engine.begin() as conn:
            conn.execute(
                text("""
                    INSERT INTO indexed_documents (id, name, file_type, chunks_count, file_size_bytes, status, created_at)
                    VALUES (:id, :name, :file_type, :chunks_count, :file_size_bytes, :status, CURRENT_TIMESTAMP)
                    ON CONFLICT (name) DO UPDATE SET
                        chunks_count = EXCLUDED.chunks_count,
                        file_size_bytes = EXCLUDED.file_size_bytes,
                        status = EXCLUDED.status,
                        created_at = CURRENT_TIMESTAMP;
                """),
                {
                    "id": doc_id,
                    "name": name,
                    "file_type": file_type,
                    "chunks_count": chunks_count,
                    "file_size_bytes": file_size_bytes,
                    "status": status
                }
            )

    def get_documents(self) -> List[Dict[str, Any]]:
        if self.use_memory or not self.engine:
            return list(self.documents_store)

        with self.engine.connect() as conn:
            rows = conn.execute(text("""
                SELECT id, name, file_type, chunks_count, file_size_bytes, status, created_at
                FROM indexed_documents
                ORDER BY created_at DESC;
            """)).fetchall()
            return [
                {
                    "id": str(r[0]),
                    "name": str(r[1]),
                    "file_type": str(r[2]),
                    "chunks_count": int(r[3]),
                    "file_size_bytes": int(r[4] or 0),
                    "status": str(r[5]),
                    "created_at": r[6].isoformat() if hasattr(r[6], "isoformat") else str(r[6])
                }
                for r in rows
            ]

    def delete_document(self, document_name: str) -> int:
        if self.use_memory or not self.engine:
            self.memory_store = [
                c for c in self.memory_store
                if c.get("metadata", {}).get("source") != document_name
            ]
            self.documents_store = [
                d for d in self.documents_store
                if d.get("name") != document_name
            ]
            return 1

        with self.engine.begin() as conn:
            conn.execute(
                text("DELETE FROM document_chunks WHERE metadata->>'source' = :name;"),
                {"name": document_name}
            )
            deleted = conn.execute(
                text("DELETE FROM indexed_documents WHERE name = :name;"),
                {"name": document_name}
            ).rowcount
        return deleted


vector_store = VectorStore()

