from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from app.core.telemetry import telemetry

router = APIRouter(prefix="/api/feedback", tags=["Observability Feedback"])

class FeedbackRequest(BaseModel):
    trace_id: str = Field(..., example="trace-17111223344")
    score: float = Field(..., ge=-1.0, le=1.0, example=1.0)
    comment: Optional[str] = Field(default=None, example="Réponse très pertinente et bien sourcée.")

@router.post("")
async def submit_feedback(payload: FeedbackRequest):
    """Enregistre le feedback utilisateur (+1 / -1) associé à la trace d'observabilité Langfuse."""
    try:
        success = telemetry.record_feedback(
            trace_id=payload.trace_id,
            score=payload.score,
            comment=payload.comment
        )
        return {"status": "recorded", "trace_id": payload.trace_id, "score": payload.score}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
