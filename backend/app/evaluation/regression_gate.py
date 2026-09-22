import os
import json
import sys
import logging
from typing import Dict, Any, List
from app.evaluation.metrics import eval_metrics
from app.evaluation.llm_judge import llm_judge
from app.generation.rag_pipeline import rag_pipeline
from app.generation.prompts import PROMPT_VERSION

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

FAITHFULNESS_THRESHOLD = 0.85
RELEVANCE_THRESHOLD = 0.70
JUDGE_SCORE_THRESHOLD = 3.8

def run_regression_gate(dataset_path: str = "app/evaluation/golden_dataset.json") -> bool:
    """Exécute le banc de test d'évaluation et valide les seuils de qualité anti-régression."""
    if not os.path.exists(dataset_path):
        logger.error(f"Golden dataset not found at {dataset_path}")
        return False

    with open(dataset_path, "r", encoding="utf-8") as f:
        cases = json.load(f)

    print(f"\n==================================================================")
    print(f"  EXÉCUTION DU QUALITY GATE CI/CD — PROMPT VERSION : {PROMPT_VERSION}")
    print(f"==================================================================")
    print(f"Nombre de cas de test dans le Golden Dataset : {len(cases)}\n")

    results: List[Dict[str, Any]] = []
    faith_scores = []
    relevance_scores = []
    judge_scores = []

    for idx, case in enumerate(cases, 1):
        q = case["question"]
        gt = case.get("ground_truth", "")
        kw = case.get("keywords", [])

        # Exécution RAG
        rag_output = rag_pipeline.run(query=q)
        answer = rag_output["answer"]
        contexts = [s["content"] for s in rag_output.get("sources", [])]

        # Calcul métriques
        faith = eval_metrics.calculate_faithfulness(answer, contexts)
        relevance = eval_metrics.calculate_answer_relevance(answer, q, kw)
        judge_res = llm_judge.evaluate_response(question=q, answer=answer, contexts=contexts, ground_truth=gt)

        faith_scores.append(faith)
        relevance_scores.append(relevance)
        judge_scores.append(judge_res["judge_score"])

        results.append({
            "id": case["id"],
            "question": q,
            "faithfulness": faith,
            "relevance": relevance,
            "judge_score": judge_res["judge_score"],
            "verdict": judge_res["verdict"],
            "reasoning": judge_res["reasoning"]
        })

        status_icon = "✅" if judge_res["verdict"] == "PASS" and faith >= FAITHFULNESS_THRESHOLD else "⚠️"
        print(f"[{idx}/{len(cases)}] {status_icon} Cas {case['id']} : Faith={faith:.2f} | Rel={relevance:.2f} | Juge={judge_res['judge_score']}/5 ({judge_res['verdict']})")

    avg_faith = sum(faith_scores) / len(faith_scores)
    avg_relevance = sum(relevance_scores) / len(relevance_scores)
    avg_judge = sum(judge_scores) / len(judge_scores)

    print("\n------------------------------------------------------------------")
    print(f"  RÉSULTATS GLOBAUX DU QUALITY GATE :")
    print(f"  - Fidélité moyenne (Faithfulness)  : {avg_faith:.3f} (Seuil requis: {FAITHFULNESS_THRESHOLD})")
    print(f"  - Pertinence moyenne (Relevancy)   : {avg_relevance:.3f} (Seuil requis: {RELEVANCE_THRESHOLD})")
    print(f"  - Score moyen LLM-as-a-Judge      : {avg_judge:.2f}/5 (Seuil requis: {JUDGE_SCORE_THRESHOLD})")
    print("------------------------------------------------------------------")

    passed = (
        avg_faith >= FAITHFULNESS_THRESHOLD and
        avg_relevance >= RELEVANCE_THRESHOLD and
        avg_judge >= JUDGE_SCORE_THRESHOLD
    )

    # Sauvegarde du rapport Markdown pour la Pull Request
    report_md = f"""# 📊 Rapport d'Évaluation LLMOps Quality Gate

- **Prompt Version :** `{PROMPT_VERSION}`
- **Statut Global :** {"🟢 **SUCCÈS (PR Déployable)**" if passed else "🔴 **ÉCHEC (Régression Détectée)**"}

| Métrique | Score Obtenu | Seuil Requis | Statut |
|---|---|---|---|
| **Faithfulness (Anti-Hallucination)** | **{avg_faith:.3f}** | {FAITHFULNESS_THRESHOLD} | {"✅ Conforme" if avg_faith >= FAITHFULNESS_THRESHOLD else "❌ Non conforme"} |
| **Answer Relevancy** | **{avg_relevance:.3f}** | {RELEVANCE_THRESHOLD} | {"✅ Conforme" if avg_relevance >= RELEVANCE_THRESHOLD else "❌ Non conforme"} |
| **LLM-as-a-Judge Score** | **{avg_judge:.2f} / 5** | {JUDGE_SCORE_THRESHOLD} | {"✅ Conforme" if avg_judge >= JUDGE_SCORE_THRESHOLD else "❌ Non conforme"} |

### Détail par cas de test :
| Cas | Question | Faithfulness | Relevancy | Juge | Verdict |
|---|---|---|---|---|---|
"""
    for r in results:
        report_md += f"| `{r['id']}` | {r['question'][:45]}... | {r['faithfulness']} | {r['relevance']} | {r['judge_score']}/5 | {r['verdict']} |\n"

    with open("eval_report.md", "w", encoding="utf-8") as rf:
        rf.write(report_md)
    print("\n📄 Rapport complet sauvegardé dans 'eval_report.md'")

    if passed:
        print("\n🎉 QUALITY GATE VALIDÉ AVEC SUCCÈS. Déploiement autorisé.\n")
        return True
    else:
        print("\n❌ ÉCHEC DU QUALITY GATE : Régression de qualité détectée. Merge bloqué.\n")
        return False

if __name__ == "__main__":
    dataset_file = sys.argv[1] if len(sys.argv) > 1 else "app/evaluation/golden_dataset.json"
    success = run_regression_gate(dataset_file)
    sys.exit(0 if success else 1)
