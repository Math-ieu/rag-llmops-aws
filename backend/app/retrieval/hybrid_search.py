from typing import List, Dict, Any
from rank_bm25 import BM25Okapi
from app.ingestion.vector_store import vector_store
from app.core.bedrock_client import bedrock_client

class HybridSearchRetriever:
    """Moteur de recherche hybride combinant recherche dense (vectorielle) et sparse (BM25) via Reciprocal Rank Fusion (RRF)."""

    def __init__(self, rrf_k: int = 60):
        self.rrf_k = rrf_k

    def _tokenize(self, text: str) -> List[str]:
        return text.lower().replace(".", " ").replace(",", " ").split()

    def retrieve(
        self,
        query: str,
        top_k: int = 4,
        dense_weight: float = 0.7
    ) -> List[Dict[str, Any]]:
        # 1. Recherche dense (embeddings)
        query_embedding = bedrock_client.get_embedding(query)
        dense_results = vector_store.search_similar(
            query_embedding,
            top_k=top_k * 2,
            similarity_threshold=0.25
        )

        # Si pas assez de documents indexés, retourner les résultats denses directement
        all_chunks = vector_store.memory_store if vector_store.use_memory else dense_results
        if not all_chunks:
            return []

        # 2. Recherche lexicale BM25
        corpus = [chunk["content"] for chunk in all_chunks]
        tokenized_corpus = [self._tokenize(doc) for doc in corpus]
        tokenized_query = self._tokenize(query)

        bm25 = BM25Okapi(tokenized_corpus)
        bm25_scores = bm25.get_scores(tokenized_query)

        sparse_ranked = sorted(
            zip(all_chunks, bm25_scores),
            key=lambda x: x[1],
            reverse=True
        )

        # 3. Reciprocal Rank Fusion (RRF)
        rrf_scores: Dict[str, float] = {}
        chunk_map: Dict[str, Dict[str, Any]] = {}

        # Classement dense
        for rank, chunk in enumerate(dense_results):
            cid = chunk["id"]
            chunk_map[cid] = chunk
            rrf_scores[cid] = rrf_scores.get(cid, 0.0) + (dense_weight / (self.rrf_k + rank + 1))

        # Classement sparse BM25
        for rank, (chunk, score) in enumerate(sparse_ranked[:top_k * 2]):
            cid = chunk["id"]
            if cid not in chunk_map:
                chunk_map[cid] = {
                    "id": chunk["id"],
                    "content": chunk["content"],
                    "metadata": chunk["metadata"],
                    "similarity_score": round(float(score), 4)
                }
            sparse_weight = 1.0 - dense_weight
            rrf_scores[cid] = rrf_scores.get(cid, 0.0) + (sparse_weight / (self.rrf_k + rank + 1))

        # Tri final par score fusionné
        sorted_ids = sorted(rrf_scores.keys(), key=lambda cid: rrf_scores[cid], reverse=True)
        final_results = []
        for cid in sorted_ids[:top_k]:
            item = chunk_map[cid].copy()
            item["rrf_score"] = round(rrf_scores[cid], 5)
            final_results.append(item)

        return final_results


hybrid_retriever = HybridSearchRetriever()
