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

logger = logging.getLogger(__name__)

# Prix AWS Bedrock en USD pour Claude 3.5 Sonnet
PRICE_INPUT_1K = 0.003
PRICE_OUTPUT_1K = 0.015

class RAGPipeline:
    """Pipeline RAG complet avec recherche hybride, reranking, génération Bedrock et traçabilité Langfuse."""

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

        # 1. Retrieval Span
        t_retrieval_start = time.time()
        retrieval_span = trace.span(name="hybrid-retrieval", metadata={"top_k": settings.TOP_K_CHUNKS})
        raw_candidates = hybrid_retriever.retrieve(query, top_k=settings.TOP_K_CHUNKS)
        filtered_sources = reranker.rerank(query, raw_candidates, top_n=3)
        retrieval_span.end(metadata={"candidates_found": len(raw_candidates), "retained": len(filtered_sources)})
        retrieval_latency_ms = int((time.time() - t_retrieval_start) * 1000)

        # 2. Construction du prompt
        system_prompt = format_rag_prompt(filtered_sources)
        messages = (chat_history or []) + [{"role": "user", "content": query}]

        # 3. Generation Span
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
                "prompt_version": PROMPT_VERSION
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

        # Retrieval
        t_ret = time.time()
        raw_candidates = hybrid_retriever.retrieve(query, top_k=settings.TOP_K_CHUNKS)
        filtered_sources = reranker.rerank(query, raw_candidates, top_n=3)
        ret_latency = int((time.time() - t_ret) * 1000)

        # Envoi initial des métadonnées et sources sous forme d'événement SSE
        yield f"event: metadata\ndata: {json.dumps({'trace_id': trace.id, 'sources': filtered_sources, 'retrieval_ms': ret_latency})}\n\n"

        system_prompt = format_rag_prompt(filtered_sources)
        messages = (chat_history or []) + [{"role": "user", "content": query}]

        output_text = []
        for token in bedrock_client.generate_stream(messages, system_prompt):
            output_text.append(token)
            payload = json.dumps({"token": token})
            yield f"event: token\ndata: {payload}\n\n"

        # Fin du stream
        full_text = "".join(output_text)
        total_latency = int((time.time() - start_time) * 1000)
        # Estimation des tokens
        in_tokens = int(len(system_prompt + query) / 4)
        out_tokens = int(len(full_text) / 4)
        cost_usd = self._calculate_cost(in_tokens, out_tokens)

        trace.update(metadata={"total_latency_ms": total_latency, "cost_usd": cost_usd})
        yield f"event: done\ndata: {json.dumps({'total_latency_ms': total_latency, 'cost_usd': cost_usd, 'tokens': in_tokens + out_tokens})}\n\n"


rag_pipeline = RAGPipeline()
