from typing import List, Dict, Any

class Reranker:
    """Module de Reranking pour sélectionner les passages les plus pertinents avant la génération."""

    @staticmethod
    def rerank(query: str, candidates: List[Dict[str, Any]], top_n: int = 3) -> List[Dict[str, Any]]:
        if not candidates:
            return []
        
        # Algorithme de scoring de pertinence fine basé sur la densité de recouvrement des termes clés
        q_words = set(query.lower().split())
        scored = []
        for doc in candidates:
            content_lower = doc["content"].lower()
            overlap = sum(1 for w in q_words if w in content_lower)
            base_score = doc.get("rrf_score", doc.get("similarity_score", 0.5))
            final_relevance = (base_score * 0.6) + ((overlap / max(len(q_words), 1)) * 0.4)
            
            d_copy = doc.copy()
            d_copy["rerank_score"] = round(final_relevance, 4)
            scored.append(d_copy)

        scored.sort(key=lambda x: x["rerank_score"], reverse=True)
        return scored[:top_n]

reranker = Reranker()
