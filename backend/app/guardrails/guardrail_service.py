import re
import logging
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass
from app.config import settings

logger = logging.getLogger(__name__)

@dataclass
class GuardrailResult:
    is_safe: bool
    sanitized_text: str
    violations: List[str]
    pii_redacted: bool
    redaction_count: int
    refusal_message: Optional[str] = None


class GuardrailService:
    """Service de gouvernance et sécurité des requêtes RAG (Anti-injection, Filtrage PII, Conformité)."""

    def __init__(self):
        # Patterns d'injection de prompt et d'évasion (Jailbreak)
        self.injection_patterns = [
            re.compile(r"(?i)\b(ignore|disregard|forget|override|bypass)\s+(all\s+)?(previous|past|prior|above|system)\s+(instructions|directives|prompts|rules|commands)"),
            re.compile(r"(?i)\b(tu\s+dois\s+ignorer|ignore\s+les\s+règles|oublie\s+toutes\s+les\s+instructions|contourne\s+les\s+règles)"),
            re.compile(r"(?i)\b(system\s+prompt\s+(reveal|leak|print|show|dump)|what\s+is\s+your\s+system\s+prompt)"),
            re.compile(r"(?i)\b(révèle|affiche|donne-moi|montre)\s+(ton|le)\s+(prompt\s+système|instructions\s+système)"),
            re.compile(r"(?i)\b(you\s+are\s+now\s+(in\s+)?(dan|developer|unrestricted|jailbreak(ed)?)\s+mode)"),
            re.compile(r"(?i)\b(act\s+as\s+an\s+unfiltered\s+ai|sans\s+aucune\s+restriction\s+éthique)"),
            re.compile(r"(?i)\b(tu\s+es\s+désormais\s+libre\s+de\s+toute\s+restriction)"),
            re.compile(r"(?i)\b(repeat\s+the\s+words\s+above\s+starting\s+with)"),
        ]

        # Patterns de cyberattaques directes / code malveillant
        self.harmful_patterns = [
            re.compile(r"(?i)\b(génère|écris|crée)\s+(un\s+)?(ransomware|trojan|malware|keylogger|rootkit)"),
            re.compile(r"(?i)\b(write|create|generate)\s+(a\s+)?(ransomware|trojan|malware|keylogger|exploit\s+payload)"),
        ]

        # Patterns PII (Personally Identifiable Information)
        self.pii_rules: List[Tuple[str, re.Pattern, str]] = [
            (
                "email",
                re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b"),
                "[EMAIL_MASQUÉ]"
            ),
            (
                "phone_fr",
                re.compile(r"(?:(?:\+|00)33|0)[1-9](?:[\s.-]?\d{2}){4}\b"),
                "[TÉLÉPHONE_MASQUÉ]"
            ),
            (
                "credit_card",
                re.compile(r"\b(?:\d{4}[-\s]?){3}\d{4}\b"),
                "[CARTE_BANCAIRE_MASQUÉE]"
            ),
            (
                "french_ssn_nir",
                re.compile(r"\b[12]\s?\d{2}\s?(?:0[1-9]|1[0-2])\s?\d{2}\s?\d{3}\s?\d{3}(?:\s?\d{2})?\b"),
                "[NIR_MASQUÉ]"
            ),
            (
                "api_key_aws",
                re.compile(r"\bAKIA[0-9A-Z]{16}\b"),
                "[SECRET_AWS_MASQUÉ]"
            ),
            (
                "api_token",
                re.compile(r"\b(?:ghp_[a-zA-Z0-9]{36}|bearer\s+[a-zA-Z0-9_\-\.]{25,}|sk-[a-zA-Z0-9]{32,})\b", re.IGNORECASE),
                "[TOKEN_SECRET_MASQUÉ]"
            )
        ]

    def evaluate(self, text: str) -> GuardrailResult:
        """Évalue une requête entrante : injection, malveillance et masquage PII."""
        if not settings.ENABLE_GUARDRAILS:
            return GuardrailResult(
                is_safe=True,
                sanitized_text=text,
                violations=[],
                pii_redacted=False,
                redaction_count=0
            )

        violations = []

        # 1. Détection de Prompt Injection
        for pat in self.injection_patterns:
            if pat.search(text):
                violations.append("prompt_injection")
                logger.warning(f"Guardrail Alert: Prompt injection attempt detected in query: {text[:80]}...")
                return GuardrailResult(
                    is_safe=False,
                    sanitized_text=text,
                    violations=violations,
                    pii_redacted=False,
                    redaction_count=0,
                    refusal_message="Cette requête a été bloquée par les politiques de gouvernance Kortex : tentative de contournement des consignes système détectée."
                )

        # 2. Détection d'intentions nuisibles
        for pat in self.harmful_patterns:
            if pat.search(text):
                violations.append("harmful_cyber_intent")
                logger.warning(f"Guardrail Alert: Harmful cyber intent detected: {text[:80]}...")
                return GuardrailResult(
                    is_safe=False,
                    sanitized_text=text,
                    violations=violations,
                    pii_redacted=False,
                    redaction_count=0,
                    refusal_message="Cette requête a été bloquée par les règles de conformité : demande liée à la création de codes malveillants non autorisée."
                )

        # 3. Filtrage et masquage PII
        sanitized = text
        redaction_count = 0
        if settings.MASK_PII:
            for rule_name, rule_pat, mask_value in self.pii_rules:
                matches = rule_pat.findall(sanitized)
                if matches:
                    redaction_count += len(matches)
                    sanitized = rule_pat.sub(mask_value, sanitized)
                    violations.append(f"pii_{rule_name}")

        pii_redacted = redaction_count > 0
        if pii_redacted:
            logger.info(f"Guardrail Info: {redaction_count} PII entity(ies) masked.")

        return GuardrailResult(
            is_safe=True,
            sanitized_text=sanitized,
            violations=violations,
            pii_redacted=pii_redacted,
            redaction_count=redaction_count
        )

    def get_bedrock_guardrail_config(self) -> Optional[Dict[str, Any]]:
        """Génère la configuration Amazon Bedrock Guardrails si configurée dans l'environnement."""
        if settings.BEDROCK_GUARDRAIL_ID:
            return {
                "guardrailIdentifier": settings.BEDROCK_GUARDRAIL_ID,
                "guardrailVersion": settings.BEDROCK_GUARDRAIL_VERSION or "DRAFT",
                "trace": "enabled"
            }
        return None


guardrail_service = GuardrailService()
