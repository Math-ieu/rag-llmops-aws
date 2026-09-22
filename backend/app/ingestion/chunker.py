from typing import List, Dict, Any
import uuid

class TextChunker:
    """Découpeur de texte adaptatif avec préservation de contexte et chevauchement."""

    def __init__(self, chunk_size: int = 600, chunk_overlap: int = 100):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def split_text(self, text: str) -> List[str]:
        """Découpe récursivement selon les paragraphes, phrases et mots."""
        if len(text) <= self.chunk_size:
            return [text]

        separators = ["\n\n", "\n", ". ", "! ", "? ", "; ", " "]
        chunks = []
        start = 0

        while start < len(text):
            end = min(start + self.chunk_size, len(text))
            if end < len(text):
                # Trouver le meilleur séparateur naturel dans la fenêtre
                best_cut = -1
                for sep in separators:
                    pos = text.rfind(sep, start, end)
                    if pos != -1 and pos > start + (self.chunk_size // 2):
                        best_cut = pos + len(sep)
                        break
                if best_cut != -1:
                    end = best_cut

            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)

            # Avancer avec chevauchement
            start = end - self.chunk_overlap
            if start < 0 or start >= len(text) - self.chunk_overlap:
                break

        return chunks

    def chunk_documents(self, documents: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Transforme une liste de documents en une liste de chunks enrichis."""
        chunked_docs = []
        for doc in documents:
            raw_text = doc["content"]
            meta = doc["metadata"]
            chunks = self.split_text(raw_text)

            for idx, chunk_content in enumerate(chunks):
                chunk_id = f"{meta.get('source', 'doc')}-p{meta.get('page', 1)}-c{idx}-{uuid.uuid4().hex[:6]}"
                chunked_docs.append({
                    "id": chunk_id,
                    "content": chunk_content,
                    "metadata": {
                        **meta,
                        "chunk_index": idx,
                        "total_chunks_in_doc": len(chunks),
                        "char_length": len(chunk_content)
                    }
                })
        return chunked_docs
