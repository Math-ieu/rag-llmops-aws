import re
import uuid
from typing import List, Dict, Any

class TextChunker:
    """Découpeur de texte sémantique et hiérarchique avec préservation de structure."""

    def __init__(self, chunk_size: int = 600, chunk_overlap: int = 100):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def _extract_sections(self, text: str) -> List[Dict[str, str]]:
        """Découpe le texte en sections logiques identifiées par leurs titres."""
        lines = text.split("\n")
        sections = []
        current_heading = "Général"
        current_lines = []

        header_pattern = re.compile(r"^(#{1,6}\s+|(?:\d+\.|\b[IVXLCDM]+\.)\s+|[A-Z\s]{4,}:)(.+)$")

        for line in lines:
            stripped = line.strip()
            match = header_pattern.match(stripped)
            if match and len(stripped) < 120:
                if current_lines:
                    content = "\n".join(current_lines).strip()
                    if content:
                        sections.append({"heading": current_heading, "content": content})
                    current_lines = []
                current_heading = stripped.lstrip("#").strip()
            else:
                current_lines.append(line)

        if current_lines:
            content = "\n".join(current_lines).strip()
            if content:
                sections.append({"heading": current_heading, "content": content})

        if not sections:
            sections = [{"heading": "Général", "content": text}]

        return sections

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

            start = end - self.chunk_overlap
            if start < 0 or start >= len(text) - self.chunk_overlap:
                break

        return chunks

    def chunk_documents(self, documents: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Transforme une liste de documents en chunks enrichis de métadonnées sémantiques."""
        chunked_docs = []
        for doc in documents:
            raw_text = doc["content"]
            meta = doc["metadata"]

            sections = self._extract_sections(raw_text)
            chunk_global_idx = 0

            for sec in sections:
                heading = sec["heading"]
                sec_content = sec["content"]
                sub_chunks = self.split_text(sec_content)

                for chunk_text in sub_chunks:
                    # Enrichissement contextuel du contenu par le titre de section
                    enriched_content = (
                        f"[{heading}]\n{chunk_text}"
                        if heading and heading != "Général" and not chunk_text.startswith(f"[{heading}]")
                        else chunk_text
                    )

                    chunk_id = f"{meta.get('source', 'doc')}-p{meta.get('page', 1)}-c{chunk_global_idx}-{uuid.uuid4().hex[:6]}"
                    chunked_docs.append({
                        "id": chunk_id,
                        "content": enriched_content,
                        "metadata": {
                            **meta,
                            "section": heading,
                            "chunk_index": chunk_global_idx,
                            "char_length": len(enriched_content)
                        }
                    })
                    chunk_global_idx += 1

        return chunked_docs
