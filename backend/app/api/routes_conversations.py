from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from app.db.chat_store import chat_store

router = APIRouter(prefix="/api/chat/conversations", tags=["Chat Conversations"])

class SaveConversationRequest(BaseModel):
    title: str = Field(..., max_length=255)
    messages: List[Dict[str, Any]] = Field(default=[])
    user_id: Optional[str] = "web_client"

@router.get("")
async def get_conversations(user_id: str = Query("web_client")):
    """Retourne l'historique des discussions pour l'utilisateur."""
    try:
        return chat_store.list_conversations(user_id=user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{conversation_id}")
async def get_conversation(conversation_id: str):
    """Charge une discussion et tous ses messages enregistrés."""
    conv = chat_store.get_conversation(conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation non trouvée")
    return conv

@router.post("/{conversation_id}")
async def save_conversation(conversation_id: str, payload: SaveConversationRequest):
    """Enregistre ou met à jour une conversation et ses messages dans PostgreSQL."""
    success = chat_store.save_conversation(
        conversation_id=conversation_id,
        title=payload.title,
        messages=payload.messages,
        user_id=payload.user_id or "web_client"
    )
    if not success:
        raise HTTPException(status_code=500, detail="Échec de la sauvegarde de la discussion")
    return {"status": "saved", "id": conversation_id}

@router.delete("/{conversation_id}")
async def delete_conversation(conversation_id: str):
    """Supprime définitivement une discussion."""
    success = chat_store.delete_conversation(conversation_id)
    if not success:
        raise HTTPException(status_code=404, detail="Conversation introuvable ou déjà supprimée")
    return {"status": "deleted", "id": conversation_id}
