from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "RAG-LLMOps-AWS"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_PORT: int = 8000
    API_HOST: str = "0.0.0.0"

    # AWS & Bedrock Configuration
    AWS_REGION: str = "us-east-1"
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_SESSION_TOKEN: str = ""
    BEDROCK_LLM_MODEL_ID: str = "anthropic.claude-3-5-sonnet-20240620-v1:0"
    BEDROCK_EMBEDDING_MODEL_ID: str = "amazon.titan-embed-text-v2:0"
    MOCK_BEDROCK: bool = Field(
        default=False,
        description="Si activé, simule les réponses Bedrock sans appel payant (utile pour tests unitaires/CI)"
    )

    # Database & Vector Store
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/rag_llmops"
    VECTOR_DIMENSION: int = 1024  # Titan Embeddings v2 standard dimension
    SIMILARITY_THRESHOLD: float = 0.55
    TOP_K_CHUNKS: int = 4

    # Langfuse Observability
    LANGFUSE_PUBLIC_KEY: str = ""
    LANGFUSE_SECRET_KEY: str = ""
    LANGFUSE_HOST: str = "https://cloud.langfuse.com"
    LANGFUSE_ENABLED: bool = True

    # CloudWatch & Monitoring
    ENABLE_CLOUDWATCH_METRICS: bool = False
    CLOUDWATCH_NAMESPACE: str = "LLMOps/RAGPlatform"


settings = Settings()
