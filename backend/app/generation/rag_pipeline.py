import time
import json
import logging
from typing import Dict, Any, List, Generator, Optional
from app.config import settings
from app.core.bedrock_client import bedrock_client
from app.core.telemetry import telemetry
from app.retrieval.hybrid_search import hybrid_retriever
from app.retrieval.reranker import reranker
from app.generation.prompts import format_rag_prompt, PROMPT_VERSION
from app.cache.semantic_cache import semantic_cache
from app.guardrails.guardrail_service import guardrail_service

logger = logging.getLogger(__name__)

# Prix AWS Bedrock en USD pour Claude 3.5 Sonnet
PRICE_INPUT_1K = 0.003
PRICE_OUTPUT_1K = 0.015

class RAGPipeline:
    """Pipeline RAG complet avec Guardrails, Cache Sémantique, Recherche Hybride, Reranking et Bedrock."""

    def _calculate_cost(self, input_tokens: int, output_tokens: int) -> float:
        cost = (input_tokens / 1000.0 * PRICE_INPUT_1K) + (output_tokens / 1000.0 * PRICE_OUTPUT_1K)
        return round(cost, 6)

    def run(
        self,
        query: str,
        chat_history: Optional[List[Dict[str, str]]] = None,
        user_id: Optional[str] = "default_user",
        session_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Exécution complète du RAG en mode standard (avec trace d'observabilité)."""
        start_time = time.time()
        trace = telemetry.create_trace(
            name="rag-query-pipeline",
            user_id=user_id,
            session_id=session_id,
            metadata={"prompt_version": PROMPT_VERSION, "query": query},
            tags=["production-rag", settings.APP_ENV]
        )

        # 0. Évaluation Guardrails (Anti-injection, PII, Sécurité)
        guardrail_res = guardrail_service.evaluate(query)
        if not guardrail_res.is_safe:
            total_latency_ms = int((time.time() - start_time) * 1000)
            trace.update(metadata={"guardrail_blocked": True, "violations": guardrail_res.violations})
            return {
                "answer": guardrail_res.refusal_message or "Requête non autorisée par les politiques de sécurité.",
                "sources": [],
                "trace_id": trace.id,
                "metrics": {
                    "total_latency_ms": total_latency_ms,
                    "retrieval_latency_ms": 0,
                    "input_tokens": 0,
                    "output_tokens": 0,
                    "cost_usd": 0.0,
                    "model_id": "guardrail-block",
                    "prompt_version": PROMPT_VERSION,
                    "guardrail_blocked": True,
                    "violations": guardrail_res.violations
                }
            }

        effective_query = guardrail_res.sanitized_text

        # 1. Vérification du Cache Sémantique
        query_embedding = None
        if settings.SEMANTIC_CACHE_ENABLED:
            query_embedding = bedrock_client.get_embedding(effective_query)
            cached = semantic_cache.lookup(effective_query, query_embedding)
            if cached:
                total_latency_ms = int((time.time() - start_time) * 1000)
                trace.update(metadata={
                    "cache_hit": True,
                    "similarity": cached["similarity"],
                    "total_latency_ms": total_latency_ms,
                    "cost_usd": 0.0
                })
                return {
                    "answer": cached["answer"],
                    "sources": cached["sources"],
                    "trace_id": trace.id,
                    "metrics": {
                        "total_latency_ms": total_latency_ms,
                        "retrieval_latency_ms": 0,
                        "input_tokens": 0,
                        "output_tokens": 0,
                        "cost_usd": 0.0,
                        "cache_hit": True,
                        "cache_similarity": cached["similarity"],
                        "cache_exact": cached.get("exact_match", False),
                        "hit_count": cached["hit_count"],
                        "model_id": "semantic-cache",
                        "prompt_version": PROMPT_VERSION,
                        "pii_redacted": guardrail_res.pii_redacted
                    }
                }

        # 2. Retrieval Span (Recherche Hybride + Reranking)
        t_retrieval_start = time.time()
        retrieval_span = trace.span(name="hybrid-retrieval", metadata={"top_k": settings.TOP_K_CHUNKS})
        raw_candidates = hybrid_retriever.retrieve(effective_query, top_k=settings.TOP_K_CHUNKS)
        filtered_sources = reranker.rerank(effective_query, raw_candidates, top_n=3)
        retrieval_span.end(metadata={"candidates_found": len(raw_candidates), "retained": len(filtered_sources)})
        retrieval_latency_ms = int((time.time() - t_retrieval_start) * 1000)

        # 3. Construction du prompt
        system_prompt = format_rag_prompt(filtered_sources)
        messages = (chat_history or []) + [{"role": "user", "content": effective_query}]

        # 4. Generation Span Bedrock Claude
        gen_span = trace.generation(
            name="bedrock-claude-generation",
            model=settings.BEDROCK_LLM_MODEL_ID,
            model_parameters={"temperature": 0.2, "max_tokens": 1500}
        )
        gen_result = bedrock_client.generate_response(
            messages=messages,
            system_prompt=system_prompt,
            temperature=0.2
        )
        usage = gen_result.get("usage", {})
        input_tokens = usage.get("input_tokens", 100)
        output_tokens = usage.get("output_tokens", 50)
        cost_usd = self._calculate_cost(input_tokens, output_tokens)

        gen_span.end(
            output=gen_result["text"],
            usage={"input": input_tokens, "output": output_tokens, "total": input_tokens + output_tokens},
            metadata={"cost_usd": cost_usd}
        )

        total_latency_ms = int((time.time() - start_time) * 1000)
        trace.update(metadata={"total_latency_ms": total_latency_ms, "cost_usd": cost_usd})

        # 5. Enregistrement dans le Cache Sémantique
        if settings.SEMANTIC_CACHE_ENABLED and not gen_result.get("guardrail_intervened"):
            if query_embedding is None:
                query_embedding = bedrock_client.get_embedding(effective_query)
            semantic_cache.store(
                query=effective_query,
                query_embedding=query_embedding,
                answer=gen_result["text"],
                sources=filtered_sources
            )

        return {
            "answer": gen_result["text"],
            "sources": filtered_sources,
            "trace_id": trace.id,
            "metrics": {
                "total_latency_ms": total_latency_ms,
                "retrieval_latency_ms": retrieval_latency_ms,
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "cost_usd": cost_usd,
                "model_id": settings.BEDROCK_LLM_MODEL_ID,
                "prompt_version": PROMPT_VERSION,
                "cache_hit": False,
                "pii_redacted": guardrail_res.pii_redacted
            }
        }

    def run_stream(
        self,
        query: str,
        chat_history: Optional[List[Dict[str, str]]] = None,
        user_id: Optional[str] = "default_user",
        session_id: Optional[str] = None,
    ) -> Generator[str, None, None]:
        """Exécution en streaming Server-Sent Events (SSE)."""
        start_time = time.time()
        trace = telemetry.create_trace(
            name="rag-query-stream",
            user_id=user_id,
            session_id=session_id,
            metadata={"prompt_version": PROMPT_VERSION, "query": query}
        )

        # 0. Évaluation Guardrails
        guardrail_res = guardrail_service.evaluate(query)
        if not guardrail_res.is_safe:
            total_latency_ms = int((time.time() - start_time) * 1000)
            yield f"event: metadata\ndata: {json.dumps({'trace_id': trace.id, 'sources': [], 'retrieval_ms': 0, 'guardrail_blocked': True})}\n\n"
            refusal_text = guardrail_res.refusal_message or "Requête non autorisée par les politiques de gouvernance."
            yield f"event: token\ndata: {json.dumps({'token': refusal_text})}\n\n"
            yield f"event: done\ndata: {json.dumps({'total_latency_ms': total_latency_ms, 'cost_usd': 0.0, 'tokens': 0, 'guardrail_blocked': True})}\n\n"
            return

        effective_query = guardrail_res.sanitized_text

        # 1. Cache Sémantique
        query_embedding = None
        if settings.SEMANTIC_CACHE_ENABLED:
            query_embedding = bedrock_client.get_embedding(effective_query)
            cached = semantic_cache.lookup(effective_query, query_embedding)
            if cached:
                total_latency_ms = int((time.time() - start_time) * 1000)
                yield f"event: metadata\ndata: {json.dumps({'trace_id': trace.id, 'sources': cached['sources'], 'retrieval_ms': 0, 'cache_hit': True, 'cache_similarity': cached['similarity']})}\n\n"

                # Diffusion fluide des tokens du cache
                cached_words = cached["answer"].split(" ")
                chunk_size = 4
                for i in range(0, len(cached_words), chunk_size):
                    chunk = " ".join(cached_words[i:i+chunk_size])
                    if i + chunk_size < len(cached_words):
                        chunk += " "
                    time.sleep(0.015)
                    yield f"event: token\ndata: {json.dumps({'token': chunk})}\n\n"

                yield f"event: done\ndata: {json.dumps({'total_latency_ms': total_latency_ms, 'cost_usd': 0.0, 'tokens': 0, 'cache_hit': True, 'cache_similarity': cached['similarity']})}\n\n"
                return

        # 2. Retrieval
        t_ret = time.time()
        raw_candidates = hybrid_retriever.retrieve(effective_query, top_k=settings.TOP_K_CHUNKS)
        filtered_sources = reranker.rerank(effective_query, raw_candidates, top_n=3)
        ret_latency = int((time.time() - t_ret) * 1000)

        # Envoi initial des métadonnées et sources sous forme d'événement SSE
        yield f"event: metadata\ndata: {json.dumps({'trace_id': trace.id, 'sources': filtered_sources, 'retrieval_ms': ret_latency, 'cache_hit': False, 'pii_redacted': guardrail_res.pii_redacted})}\n\n"

        system_prompt = format_rag_prompt(filtered_sources)
        messages = (chat_history or []) + [{"role": "user", "content": effective_query}]

        output_text = []
        for token in bedrock_client.generate_stream(messages, system_prompt):
            output_text.append(token)
            payload = json.dumps({"token": token})
            yield f"event: token\ndata: {payload}\n\n"

        # Fin du stream
        full_text = "".join(output_text)
        total_latency = int((time.time() - start_time) * 1000)
        in_tokens = int(len(system_prompt + effective_query) / 4)
        out_tokens = int(len(full_text) / 4)
        cost_usd = self._calculate_cost(in_tokens, out_tokens)

        # Enregistrement dans le cache sémantique
        if settings.SEMANTIC_CACHE_ENABLED and full_text.strip():
            if query_embedding is None:
                query_embedding = bedrock_client.get_embedding(effective_query)
            semantic_cache.store(
                query=effective_query,
                query_embedding=query_embedding,
                answer=full_text,
                sources=filtered_sources
            )

        trace.update(metadata={"total_latency_ms": total_latency, "cost_usd": cost_usd})
        yield f"event: done\ndata: {json.dumps({'total_latency_ms': total_latency, 'cost_usd': cost_usd, 'tokens': in_tokens + out_tokens, 'cache_hit': False})}\n\n"


rag_pipeline = RAGPipeline()
