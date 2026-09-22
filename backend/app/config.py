import os
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    APP_NAME: str = "RAG-LLMOps-AWS"
    APP_ENV: str = Field(default="development", env="APP_ENV")
    DEBUG: bool = Field(default=True, env="DEBUG")
    API_PORT: int = Field(default=8000, env="PORT")
    API_HOST: str = Field(default="0.0.0.0", env="HOST")

    # AWS & Bedrock Configuration
    AWS_REGION: str = Field(default="us-east-1", env="AWS_REGION")
    AWS_ACCESS_KEY_ID: str = Field(default="", env="AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY: str = Field(default="", env="AWS_SECRET_ACCESS_KEY")
    AWS_SESSION_TOKEN: str = Field(default="", env="AWS_SESSION_TOKEN")
    BEDROCK_LLM_MODEL_ID: str = Field(
        default="anthropic.claude-3-5-sonnet-20240620-v1:0",
        env="BEDROCK_LLM_MODEL_ID"
    )
    BEDROCK_EMBEDDING_MODEL_ID: str = Field(
        default="amazon.titan-embed-text-v2:0",
        env="BEDROCK_EMBEDDING_MODEL_ID"
    )
    MOCK_BEDROCK: bool = Field(
        default=False,
        description="Si activé, simule les réponses Bedrock sans appel payant (utile pour tests unitaires/CI)",
        env="MOCK_BEDROCK"
    )

    # Database & Vector Store
    DATABASE_URL: str = Field(
        default="postgresql://postgres:postgres@localhost:5432/rag_llmops",
        env="DATABASE_URL"
    )
    VECTOR_DIMENSION: int = 1024  # Titan Embeddings v2 standard dimension
    SIMILARITY_THRESHOLD: float = 0.55
    TOP_K_CHUNKS: int = 4

    # Langfuse Observability
    LANGFUSE_PUBLIC_KEY: str = Field(default="", env="LANGFUSE_PUBLIC_KEY")
    LANGFUSE_SECRET_KEY: str = Field(default="", env="LANGFUSE_SECRET_KEY")
    LANGFUSE_HOST: str = Field(default="https://cloud.langfuse.com", env="LANGFUSE_HOST")
    LANGFUSE_ENABLED: bool = Field(default=True, env="LANGFUSE_ENABLED")

    # CloudWatch & Monitoring
    ENABLE_CLOUDWATCH_METRICS: bool = Field(default=False, env="ENABLE_CLOUDWATCH_METRICS")
    CLOUDWATCH_NAMESPACE: str = "LLMOps/RAGPlatform"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
