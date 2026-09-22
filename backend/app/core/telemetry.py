import time
import logging
from typing import Optional, Dict, Any
from app.config import settings

logger = logging.getLogger(__name__)

class TelemetryManager:
    """Gestionnaire d'observabilité et de télémétrie LLMOps (Langfuse & métriques)."""

    def __init__(self):
        self.langfuse = None
        if settings.LANGFUSE_ENABLED and settings.LANGFUSE_PUBLIC_KEY and settings.LANGFUSE_SECRET_KEY:
            try:
                from langfuse import Langfuse
                self.langfuse = Langfuse(
                    public_key=settings.LANGFUSE_PUBLIC_KEY,
                    secret_key=settings.LANGFUSE_SECRET_KEY,
                    host=settings.LANGFUSE_HOST,
                )
                logger.info("Langfuse telemetry initialized successfully.")
            except Exception as e:
                logger.warning(f"Failed to initialize Langfuse: {e}")
        else:
            logger.info("Langfuse telemetry running in lightweight / mock mode (no keys provided).")

    def create_trace(
        self,
        name: str,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        tags: Optional[list] = None,
    ):
        """Crée une nouvelle trace pour une requête RAG."""
        trace_id = f"trace-{int(time.time()*1000)}"
        if self.langfuse:
            try:
                trace = self.langfuse.trace(
                    name=name,
                    user_id=user_id or "anonymous",
                    session_id=session_id,
                    metadata=metadata or {},
                    tags=tags or ["rag", settings.APP_ENV],
                )
                return trace
            except Exception as e:
                logger.error(f"Error creating Langfuse trace: {e}")
        return DummyTrace(trace_id=trace_id, name=name, metadata=metadata)

    def record_feedback(self, trace_id: str, score: float, comment: Optional[str] = None):
        """Enregistre un score de feedback utilisateur (+1 ou -1) sur la trace."""
        if self.langfuse:
            try:
                self.langfuse.score(
                    trace_id=trace_id,
                    name="user-feedback",
                    value=score,
                    comment=comment,
                )
                return True
            except Exception as e:
                logger.error(f"Error recording feedback to Langfuse: {e}")
        return True

    def flush(self):
        if self.langfuse:
            try:
                self.langfuse.flush()
            except Exception:
                pass


class DummySpan:
    def __init__(self, name: str):
        self.name = name

    def end(self, **kwargs):
        pass


class DummyTrace:
    def __init__(self, trace_id: str, name: str, metadata: Optional[Dict[str, Any]] = None):
        self.id = trace_id
        self.name = name
        self.metadata = metadata or {}

    def span(self, name: str, **kwargs):
        return DummySpan(name)

    def generation(self, name: str, **kwargs):
        return DummySpan(name)

    def update(self, **kwargs):
        pass


telemetry = TelemetryManager()
