import json
import logging
import time
from typing import List, Dict, Any, Generator, Optional
import boto3
from botocore.exceptions import ClientError
from app.config import settings

logger = logging.getLogger(__name__)

class BedrockClient:
    """Wrapper pour les services de fondation Amazon Bedrock (Embeddings Titan & Claude 3.5)."""

    def __init__(self):
        self.mock_mode = settings.MOCK_BEDROCK
        self.client = None
        if not self.mock_mode:
            try:
                boto_kwargs = {"region_name": settings.AWS_REGION}
                if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
                    boto_kwargs["aws_access_key_id"] = settings.AWS_ACCESS_KEY_ID
                    boto_kwargs["aws_secret_access_key"] = settings.AWS_SECRET_ACCESS_KEY
                    if settings.AWS_SESSION_TOKEN:
                        boto_kwargs["aws_session_token"] = settings.AWS_SESSION_TOKEN
                
                self.client = boto3.client("bedrock-runtime", **boto_kwargs)
                logger.info(f"Bedrock runtime initialized on region {settings.AWS_REGION}")
            except Exception as e:
                logger.warning(f"Could not initialize Boto3 Bedrock client ({e}). Fallback to mock mode.")
                self.mock_mode = True

    def get_embedding(self, text: str) -> List[float]:
        """Génère un vecteur de 1024 dimensions via Amazon Titan Embeddings v2."""
        if self.mock_mode or not self.client:
            # Vecteur déterministe normalisé basé sur le hash du texte
            import hashlib
            seed = int(hashlib.md5(text.encode()).hexdigest(), 16)
            import numpy as np
            np.random.seed(seed % (2**32))
            vec = np.random.randn(settings.VECTOR_DIMENSION).astype(float)
            norm = np.linalg.norm(vec)
            return (vec / norm).tolist()

        try:
            body = json.dumps({
                "inputText": text[:8000],  # Limite d'entrée Titan
                "dimensions": settings.VECTOR_DIMENSION,
                "normalize": True
            })
            response = self.client.invoke_model(
                modelId=settings.BEDROCK_EMBEDDING_MODEL_ID,
                contentType="application/json",
                accept="application/json",
                body=body
            )
            response_body = json.loads(response.get("body").read())
            return response_body.get("embedding")
        except ClientError as e:
            logger.error(f"Error calling Bedrock Titan Embeddings: {e}")
            raise e

    def generate_response(
        self,
        messages: List[Dict[str, str]],
        system_prompt: str,
        temperature: float = 0.2,
        max_tokens: int = 1500,
    ) -> Dict[str, Any]:
        """Génération standard via Converse API Bedrock (Claude 3.5 Sonnet / Haiku)."""
        if self.mock_mode or not self.client:
            return {
                "text": "Ceci est une réponse simulée (Bedrock Mock Mode) pour le système RAG. "
                        "Les informations sont fidèles aux documents indexés dans la base.",
                "usage": {
                    "input_tokens": 120,
                    "output_tokens": 45,
                    "total_tokens": 165
                },
                "latency_ms": 150
            }

        start_time = time.time()
        # Formattage pour l'API Bedrock Converse
        formatted_messages = [
            {"role": m["role"], "content": [{"text": m["content"]}]}
            for m in messages
        ]
        system_config = [{"text": system_prompt}]

        try:
            response = self.client.converse(
                modelId=settings.BEDROCK_LLM_MODEL_ID,
                messages=formatted_messages,
                system=system_config,
                inferenceConfig={
                    "temperature": temperature,
                    "maxTokens": max_tokens,
                }
            )
            latency_ms = int((time.time() - start_time) * 1000)
            output_message = response["output"]["message"]["content"][0]["text"]
            usage = response.get("usage", {})

            return {
                "text": output_message,
                "usage": {
                    "input_tokens": usage.get("inputTokens", 0),
                    "output_tokens": usage.get("outputTokens", 0),
                    "total_tokens": usage.get("totalTokens", 0),
                },
                "latency_ms": latency_ms,
                "model_id": settings.BEDROCK_LLM_MODEL_ID
            }
        except ClientError as e:
            logger.error(f"Error calling Bedrock Converse API: {e}")
            raise e

    def generate_stream(
        self,
        messages: List[Dict[str, str]],
        system_prompt: str,
        temperature: float = 0.2,
        max_tokens: int = 1500,
    ) -> Generator[str, None, None]:
        """Streaming de tokens via ConverseStream API Bedrock."""
        if self.mock_mode or not self.client:
            sample_tokens = [
                "Ceci ", "est ", "une ", "réponse ", "en ", "streaming ",
                "générée ", "par ", "le ", "moteur ", "RAG ", "sur ", "AWS ", "Bedrock."
            ]
            for token in sample_tokens:
                time.sleep(0.04)
                yield token
            return

        formatted_messages = [
            {"role": m["role"], "content": [{"text": m["content"]}]}
            for m in messages
        ]
        system_config = [{"text": system_prompt}]

        try:
            response = self.client.converse_stream(
                modelId=settings.BEDROCK_LLM_MODEL_ID,
                messages=formatted_messages,
                system=system_config,
                inferenceConfig={"temperature": temperature, "maxTokens": max_tokens}
            )
            stream = response.get("stream")
            if stream:
                for event in stream:
                    if "contentBlockDelta" in event:
                        delta = event["contentBlockDelta"]["delta"]
                        if "text" in delta:
                            yield delta["text"]
        except ClientError as e:
            logger.error(f"Error in Bedrock ConverseStream: {e}")
            yield f"\n[Erreur de streaming Bedrock: {str(e)}]"


bedrock_client = BedrockClient()
