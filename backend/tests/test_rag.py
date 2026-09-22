import pytest
from app.ingestion.chunker import TextChunker
from app.ingestion.vector_store import vector_store
from app.core.bedrock_client import bedrock_client
from app.retrieval.hybrid_search import hybrid_retriever
from app.retrieval.reranker import reranker
from app.generation.prompts import format_rag_prompt
from app.generation.rag_pipeline import rag_pipeline
from app.evaluation.metrics import eval_metrics
from app.evaluation.llm_judge import llm_judge

def test_chunker():
    chunker = TextChunker(chunk_size=100, chunk_overlap=20)
    text = "Ceci est un premier paragraphe de test. " * 5
    docs = [{"content": text, "metadata": {"source": "test.txt", "page": 1}}]
    chunks = chunker.chunk_documents(docs)
    assert len(chunks) >= 2
    assert "source" in chunks[0]["metadata"]
    assert chunks[0]["metadata"]["source"] == "test.txt"

def test_vector_store_and_search():
    text_sample = "Amazon Bedrock est un service entièrement géré pour les modèles de fondation."
    chunk = {"id": "chunk-1", "content": text_sample, "metadata": {"source": "aws.md", "page": 1}}
    emb = bedrock_client.get_embedding(text_sample)
    assert len(emb) == 1024

    vector_store.insert_chunks([chunk], [emb])
    res = vector_store.search_similar(emb, top_k=1, similarity_threshold=0.5)
    assert len(res) == 1
    assert res[0]["id"] == "chunk-1"

def test_hybrid_search_and_reranking():
    candidates = hybrid_retriever.retrieve("Amazon Bedrock modèles", top_k=2)
    assert isinstance(candidates, list)
    reranked = reranker.rerank("Amazon Bedrock", candidates, top_n=1)
    assert isinstance(reranked, list)

def test_rag_pipeline_execution():
    out = rag_pipeline.run(query="Comment fonctionne Amazon Bedrock ?")
    assert "answer" in out
    assert "sources" in out
    assert "trace_id" in out
    assert "metrics" in out
    assert out["metrics"]["total_latency_ms"] >= 0

def test_evaluation_metrics():
    context = ["Amazon Bedrock permet d'accéder à Claude 3.5 Sonnet."]
    answer = "Amazon Bedrock offre un accès direct à Claude 3.5 Sonnet pour la génération."
    faith = eval_metrics.calculate_faithfulness(answer, context)
    assert faith > 0.5

    rel = eval_metrics.calculate_answer_relevance(
        answer=answer,
        question="Quel modèle est accessible sur Bedrock ?",
        expected_keywords=["Bedrock", "Claude"]
    )
    assert rel >= 0.5

def test_llm_judge():
    juge_res = llm_judge.evaluate_response(
        question="Qu'est-ce que Bedrock ?",
        answer="Amazon Bedrock est une plateforme managée d'accès aux modèles d'IA générative.",
        contexts=["Amazon Bedrock est une plateforme managée d'accès aux modèles d'IA."]
    )
    assert "judge_score" in juge_res
    assert juge_res["judge_score"] >= 3
    assert "verdict" in juge_res
