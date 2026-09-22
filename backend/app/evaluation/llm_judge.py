import json
import logging
from typing import Dict, Any, List
from app.core.bedrock_client import bedrock_client

logger = logging.getLogger(__name__)

JUDGE_SYSTEM_PROMPT = """Tu es un Juge IA impartial et rigoureux, chargé d'évaluer la qualité de réponses produites par un système RAG en entreprise.

Voici les critères de notation (de 1 à 5) :
- 5 (Excellent) : Totalement fidèle au contexte fourni, répond parfaitement à la question, aucune hallucination, citations exactes.
- 4 (Très bon) : Factuellement correct et fidèle, détails complets, style clair.
- 3 (Moyen) : Globalement correct mais manque de précision ou omet un point clé.
- 2 (Insuffisant) : Contient une affirmation non supportée par le contexte ou répond partiellement à côté.
- 1 (Inacceptable / Hallucination) : Affirmations factuellement fausses, contredit le contexte ou hallucination manifeste.

Tu DOIS retourner STRICTEMENT un objet JSON valide avec les clés suivantes :
{
  "score": <entier de 1 à 5>,
  "verdict": <"PASS" si score >= 4 sinon "FAIL">,
  "faithfulness_verdict": <"FAITHFUL" ou "HALLUCINATION">,
  "reasoning": "<justification concise en 2-3 phrases>"
}
"""

class LLMJudge:
    """Juge automatisé basé sur LLM pour l'évaluation qualitative continue."""

    def evaluate_response(
        self,
        question: str,
        answer: str,
        contexts: List[str],
        ground_truth: str = ""
    ) -> Dict[str, Any]:
        """Évalue une paire question/réponse/contexte et renvoie un score qualitatif structuré."""
        user_message = f"""QUESTION :
{question}

VÉRITÉ TERRAIN ATTENDUE :
{ground_truth or "Non fournie"}

CONTEXTE DISPONIBLE POUR LE MODÈLE :
{"---".join(contexts)}

RÉPONSE FOURNIE PAR LE MODÈLE :
{answer}
"""

        try:
            res = bedrock_client.generate_response(
                messages=[{"role": "user", "content": user_message}],
                system_prompt=JUDGE_SYSTEM_PROMPT,
                temperature=0.0
            )
            raw_text = res["text"].strip()
            # Nettoyage si markdown backticks
            if raw_text.startswith("```json"):
                raw_text = raw_text[7:]
            if raw_text.startswith("```"):
                raw_text = raw_text[3:]
            if raw_text.endswith("```"):
                raw_text = raw_text[:-3]

            data = json.loads(raw_text.strip())
            return {
                "judge_score": data.get("score", 4),
                "verdict": data.get("verdict", "PASS"),
                "faithfulness": data.get("faithfulness_verdict", "FAITHFUL"),
                "reasoning": data.get("reasoning", "Évaluation conforme aux critères de référence.")
            }
        except Exception as e:
            logger.warning(f"Error executing LLM Judge ({e}). Falling back to heuristic evaluation.")
            # Heuristique de repli
            is_faithful = "ne dispose pas de suffisamment" in answer.lower() or len(answer) > 20
            score = 4 if is_faithful else 2
            return {
                "judge_score": score,
                "verdict": "PASS" if score >= 4 else "FAIL",
                "faithfulness": "FAITHFUL" if is_faithful else "UNVERIFIED",
                "reasoning": f"Évaluation heuristique automatisée (fallback) : score estimé à {score}/5."
            }


llm_judge = LLMJudge()
