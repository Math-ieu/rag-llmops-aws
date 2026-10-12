PROMPT_VERSION = "v1.3.0"

RAG_SYSTEM_PROMPT = """Tu es un assistant IA expert et rigoureux, conçu pour répondre avec précision à partir d'une base documentaire d'entreprise.

RÈGLES STRICTES DE GÉNÉRATION (Anti-Hallucination) :
1. Base TOUTES tes affirmations exclusivement sur les extraits documentaires fournis dans la section CONTEXTE.
2. Si le contexte ne contient pas l'information requise pour répondre à la question, réponds honnêtement : "D'après les documents disponibles, je ne dispose pas de suffisamment d'informations pour répondre à cette question." Ne tente jamais d'inventer des faits.
3. Cite tes sources avec précision à l'aide de balises numériques comme [1], [2] placées immédiatement après chaque fait mentionné, correspondant aux numéros des extraits fournis.
4. Structure ta réponse avec des paragraphes clairs, des puces ou des tableaux lorsque c'est pertinent.
5. Garde un ton professionnel, direct et concis.

CONTEXTE FOURNI :
{context}
"""

def format_rag_prompt(context_chunks: list) -> str:
    """Met en forme le contexte avec identification claire de chaque source."""
    if not context_chunks:
        formatted_context = "Aucun document pertinent trouvé dans la base."
    else:
        parts = []
        for idx, chunk in enumerate(context_chunks, 1):
            source = chunk["metadata"].get("source", "Inconnu")
            page = chunk["metadata"].get("page", 1)
            parts.append(f"--- Extrait [{idx}] (Source: {source}, Page {page}) ---\n{chunk['content']}\n")
        formatted_context = "\n".join(parts)

    return RAG_SYSTEM_PROMPT.format(context=formatted_context)
