from typing import List, Dict, Any

class EvaluationMetrics:
    """Calculateur de métriques quantitatives d'évaluation RAG (Faithfulness, Relevancy, Precision)."""

    @staticmethod
    def calculate_faithfulness(answer: str, contexts: List[str]) -> float:
        """Mesure la fidélité de la réponse par rapport au contexte (anti-hallucination).
        Score entre 0.0 et 1.0.
        """
        if not contexts:
            # Si aucun contexte et que le modèle admet honnêtement ne pas savoir, fidélité parfaite
            if "ne dispose pas de suffisamment d'informations" in answer.lower():
                return 1.0
            return 0.2

        combined_context = " ".join(contexts).lower()
        sentences = [s.strip() for s in answer.replace("\n", ". ").split(". ") if len(s.strip()) > 15]
        if not sentences:
            return 1.0

        supported = 0
        for sent in sentences:
            words = [w for w in sent.lower().split() if len(w) > 4]
            if not words:
                supported += 1
                continue
            matched_words = sum(1 for w in words if w in combined_context)
            if (matched_words / len(words)) >= 0.40:
                supported += 1

        score = supported / len(sentences)
        return round(min(1.0, max(0.0, score)), 3)

    @staticmethod
    def calculate_answer_relevance(answer: str, question: str, expected_keywords: List[str]) -> float:
        """Mesure si la réponse cible précisément la question posée."""
        if not answer:
            return 0.0

        answer_lower = answer.lower()
        if not expected_keywords:
            q_keywords = [w for w in question.lower().split() if len(w) > 3]
            matched = sum(1 for w in q_keywords if w in answer_lower)
            return round(matched / max(len(q_keywords), 1), 3)

        matched = sum(1 for kw in expected_keywords if kw.lower() in answer_lower)
        coverage = matched / len(expected_keywords)
        return round(min(1.0, max(0.0, coverage)), 3)

    @staticmethod
    def calculate_context_recall(contexts: List[str], ground_truth: str) -> float:
        """Mesure si le contexte extrait contient les faits attendus de la vérité terrain."""
        if not contexts or not ground_truth:
            return 0.0

        combined = " ".join(contexts).lower()
        gt_words = [w for w in ground_truth.lower().split() if len(w) > 4]
        if not gt_words:
            return 1.0

        found = sum(1 for w in gt_words if w in combined)
        return round(min(1.0, max(0.0, found / len(gt_words))), 3)


eval_metrics = EvaluationMetrics()
