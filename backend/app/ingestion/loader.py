import os
from typing import List, Dict, Any
from pypdf import PdfReader
import logging

logger = logging.getLogger(__name__)

class DocumentLoader:
    """Chargeur de documents (PDF, Markdown, texte brut)."""

    @staticmethod
    def load_pdf(file_path: str) -> List[Dict[str, Any]]:
        """Extrait le texte d'un PDF page par page avec métadonnées."""
        documents = []
        try:
            reader = PdfReader(file_path)
            file_name = os.path.basename(file_path)
            for idx, page in enumerate(reader.pages):
                text = page.extract_text() or ""
                clean_text = " ".join(text.split())
                if clean_text:
                    documents.append({
                        "content": clean_text,
                        "metadata": {
                            "source": file_name,
                            "page": idx + 1,
                            "total_pages": len(reader.pages),
                            "file_type": "pdf"
                        }
                    })
        except Exception as e:
            logger.error(f"Error loading PDF {file_path}: {e}")
            raise e
        return documents

    @staticmethod
    def load_markdown(file_path: str) -> List[Dict[str, Any]]:
        """Charge un fichier Markdown ou texte."""
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        file_name = os.path.basename(file_path)
        return [{
            "content": content,
            "metadata": {
                "source": file_name,
                "page": 1,
                "total_pages": 1,
                "file_type": "markdown" if file_path.endswith((".md", ".markdown")) else "text"
            }
        }]

    @classmethod
    def load_file(cls, file_path: str) -> List[Dict[str, Any]]:
        if file_path.lower().endswith(".pdf"):
            return cls.load_pdf(file_path)
        else:
            return cls.load_markdown(file_path)
