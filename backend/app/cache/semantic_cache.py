import json
import uuid
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import numpy as np
from sqlalchemy import create_engine, text
from app.config import settings

logger = logging.getLogger(__name__)

class SemanticCache:
    """Cache sémantique basé sur pgvector et similarité cosinus avec fallback mémoire."""

    def __init__(self):
        self.engine = None
        self.use_memory = False
        self.memory_cache: List[Dict[str, Any]] = []

        try:
            db_url = settings.DATABASE_URL
            if db_url.startswith("postgresql://") and not db_url.startswith("postgresql+"):
                db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)
            self.engine = create_engine(db_url, pool_pre_ping=True)
            with self.engine.connect() as conn:
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
                conn.execute(text(f"""
                    CREATE TABLE IF NOT EXISTS semantic_cache (
                        id VARCHAR(128) PRIMARY KEY,
                        query TEXT NOT NULL,
                        query_normalized TEXT NOT NULL,
                        embedding vector({settings.VECTOR_DIMENSION}) NOT NULL,
                        answer TEXT NOT NULL,
                        sources JSONB DEFAULT '[]'::jsonb,
                        hit_count INT DEFAULT 1,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                        last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                    );
                """))
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_semantic_cache_embedding 
                    ON semantic_cache USING hnsw (embedding vector_cosine_ops);
                """))
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_semantic_cache_normalized 
                    ON semantic_cache(query_normalized);
                """))
                conn.commit()
            logger.info("SemanticCache initialized on PostgreSQL with pgvector.")
        except Exception as e:
            logger.warning(f"PostgreSQL connection for SemanticCache failed ({e}). Running in-memory cache mode.")
            self.use_memory = True

    def _normalize_query(self, query: str) -> str:
        return " ".join(query.strip().lower().split())

    def lookup(
        self,
        query: str,
        query_embedding: List[float],
        threshold: Optional[float] = None
    ) -> Optional[Dict[str, Any]]:
        """Recherche une entrée en cache sémantiquement proche de la question."""
        if not settings.SEMANTIC_CACHE_ENABLED:
            return None

        sim_threshold = threshold if threshold is not None else settings.SEMANTIC_CACHE_THRESHOLD
        norm_query = self._normalize_query(query)

        # 1. Fallback Mémoire
        if self.use_memory or not self.engine:
            if not self.memory_cache:
                return None

            # Vérification exacte en premier
            for item in self.memory_cache:
                if item["query_normalized"] == norm_query:
                    item["hit_count"] += 1
                    item["last_accessed_at"] = datetime.now(timezone.utc).isoformat()
                    return {
                        "id": item["id"],
                        "query": item["query"],
                        "answer": item["answer"],
                        "sources": item["sources"],
                        "similarity": 1.0,
                        "hit_count": item["hit_count"],
                        "exact_match": True
                    }

            # Recherche par similarité cosinus numpy
            q_vec = np.array(query_embedding, dtype=float)
            q_norm = np.linalg.norm(q_vec)
            if q_norm == 0:
                return None

            best_match = None
            best_sim = -1.0
            for item in self.memory_cache:
                d_vec = item["embedding"]
                d_norm = np.linalg.norm(d_vec)
                if d_norm == 0:
                    continue
                sim = float(np.dot(q_vec, d_vec) / (q_norm * d_norm))
                if sim > best_sim:
                    best_sim = sim
                    best_match = item

            if best_match and best_sim >= sim_threshold:
                best_match["hit_count"] += 1
                best_match["last_accessed_at"] = datetime.now(timezone.utc).isoformat()
                return {
                    "id": best_match["id"],
                    "query": best_match["query"],
                    "answer": best_match["answer"],
                    "sources": best_match["sources"],
                    "similarity": round(best_sim, 4),
                    "hit_count": best_match["hit_count"],
                    "exact_match": False
                }
            return None

        # 2. Requête PostgreSQL avec pgvector
        try:
            with self.engine.connect() as conn:
                # Vérification exacte
                exact_row = conn.execute(
                    text("""
                        SELECT id, query, answer, sources, hit_count
                        FROM semantic_cache
                        WHERE query_normalized = :q_norm
                        ORDER BY last_accessed_at DESC
                        LIMIT 1;
                    """),
                    {"q_norm": norm_query}
                ).fetchone()

                if exact_row:
                    cid, cquery, canswer, csources, chit = exact_row
                    sources_list = json.loads(csources) if isinstance(csources, str) else (csources or [])
                    with self.engine.begin() as up_conn:
                        up_conn.execute(
                            text("UPDATE semantic_cache SET hit_count = hit_count + 1, last_accessed_at = CURRENT_TIMESTAMP WHERE id = :id;"),
                            {"id": cid}
                        )
                    return {
                        "id": cid,
                        "query": cquery,
                        "answer": canswer,
                        "sources": sources_list,
                        "similarity": 1.0,
                        "hit_count": chit + 1,
                        "exact_match": True
                    }

                # Recherche vectorielle cosinus
                embedding_str = "[" + ",".join(map(str, query_embedding)) + "]"
                sim_row = conn.execute(
                    text("""
                        SELECT 
                            id, 
                            query, 
                            answer, 
                            sources, 
                            hit_count,
                            1 - (embedding <=> :embedding) as similarity
                        FROM semantic_cache
                        WHERE 1 - (embedding <=> :embedding) >= :threshold
                        ORDER BY similarity DESC
                        LIMIT 1;
                    """),
                    {"embedding": embedding_str, "threshold": sim_threshold}
                ).fetchone()

                if sim_row:
                    cid, cquery, canswer, csources, chit, csim = sim_row
                    sources_list = json.loads(csources) if isinstance(csources, str) else (csources or [])
                    with self.engine.begin() as up_conn:
                        up_conn.execute(
                            text("UPDATE semantic_cache SET hit_count = hit_count + 1, last_accessed_at = CURRENT_TIMESTAMP WHERE id = :id;"),
                            {"id": cid}
                        )
                    return {
                        "id": cid,
                        "query": cquery,
                        "answer": canswer,
                        "sources": sources_list,
                        "similarity": round(float(csim), 4),
                        "hit_count": chit + 1,
                        "exact_match": False
                    }
        except Exception as e:
            logger.error(f"Error during semantic cache lookup: {e}")

        return None

    def store(
        self,
        query: str,
        query_embedding: List[float],
        answer: str,
        sources: List[Dict[str, Any]]
    ) -> str:
        """Enregistre un nouveau couple question/réponse dans le cache."""
        if not settings.SEMANTIC_CACHE_ENABLED:
            return ""

        entry_id = str(uuid.uuid4())
        norm_query = self._normalize_query(query)

        if self.use_memory or not self.engine:
            self.memory_cache.append({
                "id": entry_id,
                "query": query,
                "query_normalized": norm_query,
                "embedding": np.array(query_embedding, dtype=float),
                "answer": answer,
                "sources": sources,
                "hit_count": 1,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "last_accessed_at": datetime.now(timezone.utc).isoformat()
            })
            return entry_id

        try:
            embedding_str = "[" + ",".join(map(str, query_embedding)) + "]"
            with self.engine.begin() as conn:
                conn.execute(
                    text("""
                        INSERT INTO semantic_cache (
                            id, query, query_normalized, embedding, answer, sources, hit_count, last_accessed_at
                        )
                        VALUES (
                            :id, :query, :norm, :embedding, :answer, :sources, 1, CURRENT_TIMESTAMP
                        );
                    """),
                    {
                        "id": entry_id,
                        "query": query,
                        "norm": norm_query,
                        "embedding": embedding_str,
                        "answer": answer,
                        "sources": json.dumps(sources)
                    }
                )
            return entry_id
        except Exception as e:
            logger.error(f"Error storing into semantic cache: {e}")
            return ""

    def get_stats(self) -> Dict[str, Any]:
        """Retourne les métriques d'efficacité du cache sémantique."""
        if self.use_memory or not self.engine:
            total_entries = len(self.memory_cache)
            total_hits = sum(max(0, item.get("hit_count", 1) - 1) for item in self.memory_cache)
            saved_cost = round(total_hits * 0.0035, 4)
            return {
                "total_entries": total_entries,
                "total_hits": total_hits,
                "saved_cost_usd": saved_cost,
                "backend": "in-memory"
            }

        try:
            with self.engine.connect() as conn:
                row = conn.execute(text("""
                    SELECT 
                        COUNT(*), 
                        COALESCE(SUM(hit_count - 1), 0)
                    FROM semantic_cache;
                """)).fetchone()
                total_entries = row[0] or 0
                total_hits = int(row[1] or 0)
                saved_cost = round(total_hits * 0.0035, 4)
                return {
                    "total_entries": total_entries,
                    "total_hits": total_hits,
                    "saved_cost_usd": saved_cost,
                    "backend": "postgresql-pgvector"
                }
        except Exception as e:
            logger.error(f"Error fetching cache stats: {e}")
            return {"total_entries": 0, "total_hits": 0, "saved_cost_usd": 0.0, "backend": "error"}

    def clear(self) -> bool:
        """Vide l'intégralité du cache."""
        if self.use_memory or not self.engine:
            self.memory_cache.clear()
            return True

        try:
            with self.engine.begin() as conn:
                conn.execute(text("TRUNCATE TABLE semantic_cache;"))
            return True
        except Exception as e:
            logger.error(f"Error clearing cache: {e}")
            return False


semantic_cache = SemanticCache()
