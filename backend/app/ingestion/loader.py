import os
import csv
import json
import zipfile
import xml.etree.ElementTree as ET
import logging
from typing import List, Dict, Any
from pypdf import PdfReader

logger = logging.getLogger(__name__)

class DocumentLoader:
    """Chargeur de documents multi-formats (PDF, Markdown, DOCX, XLSX, CSV, JSON, TXT)."""

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
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
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

    @staticmethod
    def load_docx(file_path: str) -> List[Dict[str, Any]]:
        """Extrait le texte structuré d'un fichier Microsoft Word (.docx)."""
        file_name = os.path.basename(file_path)
        try:
            with zipfile.ZipFile(file_path, "r") as z:
                xml_content = z.read("word/document.xml")
            tree = ET.fromstring(xml_content)
            namespaces = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
            paragraphs = []
            for p in tree.iterfind(".//w:p", namespaces):
                texts = [node.text for node in p.iterfind(".//w:t", namespaces) if node.text]
                if texts:
                    paragraphs.append("".join(texts))
            clean_text = "\n\n".join(paragraphs).strip()
            return [{
                "content": clean_text if clean_text else "Document Word vide",
                "metadata": {
                    "source": file_name,
                    "page": 1,
                    "total_pages": 1,
                    "file_type": "docx"
                }
            }]
        except Exception as e:
            logger.error(f"Error loading DOCX {file_path}: {e}")
            raise e

    @staticmethod
    def load_csv(file_path: str) -> List[Dict[str, Any]]:
        """Charge et formate un fichier CSV en représentation tabulaire structurée."""
        file_name = os.path.basename(file_path)
        rows_text = []
        try:
            with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                reader = csv.reader(f)
                header = next(reader, None)
                if header:
                    rows_text.append("Colonnes: " + " | ".join(header))
                    for row_idx, row in enumerate(reader, 1):
                        formatted_row = " | ".join(f"{h}: {val}" for h, val in zip(header, row) if val.strip())
                        if formatted_row:
                            rows_text.append(f"Ligne {row_idx}: {formatted_row}")
            clean_text = "\n".join(rows_text)
            return [{
                "content": clean_text if clean_text else "Fichier CSV vide",
                "metadata": {
                    "source": file_name,
                    "page": 1,
                    "total_pages": 1,
                    "file_type": "csv"
                }
            }]
        except Exception as e:
            logger.error(f"Error loading CSV {file_path}: {e}")
            raise e

    @staticmethod
    def load_json(file_path: str) -> List[Dict[str, Any]]:
        """Charge un fichier JSON structuré."""
        file_name = os.path.basename(file_path)
        try:
            with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                data = json.load(f)
            formatted = json.dumps(data, indent=2, ensure_ascii=False)
            return [{
                "content": formatted,
                "metadata": {
                    "source": file_name,
                    "page": 1,
                    "total_pages": 1,
                    "file_type": "json"
                }
            }]
        except Exception as e:
            logger.error(f"Error loading JSON {file_path}: {e}")
            raise e

    @staticmethod
    def load_xlsx(file_path: str) -> List[Dict[str, Any]]:
        """Extrait les données tabulaires d'un classeur Excel (.xlsx)."""
        file_name = os.path.basename(file_path)
        try:
            with zipfile.ZipFile(file_path, "r") as z:
                shared_strings = []
                if "xl/sharedStrings.xml" in z.namelist():
                    tree = ET.fromstring(z.read("xl/sharedStrings.xml"))
                    ns = {"main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
                    for si in tree.iterfind(".//main:si", ns):
                        texts = [t.text for t in si.iterfind(".//main:t", ns) if t.text]
                        shared_strings.append("".join(texts))

                sheet_rows = []
                if "xl/worksheets/sheet1.xml" in z.namelist():
                    tree = ET.fromstring(z.read("xl/worksheets/sheet1.xml"))
                    ns = {"main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
                    for row in tree.iterfind(".//main:row", ns):
                        cells = []
                        for c in row.iterfind(".//main:c", ns):
                            t_type = c.get("t")
                            v = c.find("main:v", ns)
                            val = ""
                            if v is not None and v.text:
                                if t_type == "s" and v.text.isdigit():
                                    idx = int(v.text)
                                    val = shared_strings[idx] if idx < len(shared_strings) else v.text
                                else:
                                    val = v.text
                            if val:
                                cells.append(val)
                        if cells:
                            sheet_rows.append(" | ".join(cells))

            content = "\n".join(sheet_rows) if sheet_rows else "Feuille de calcul vide"
            return [{
                "content": content,
                "metadata": {
                    "source": file_name,
                    "page": 1,
                    "total_pages": 1,
                    "file_type": "xlsx"
                }
            }]
        except Exception as e:
            logger.error(f"Error loading XLSX {file_path}: {e}")
            raise e

    @classmethod
    def load_file(cls, file_path: str) -> List[Dict[str, Any]]:
        """Détecte l'extension et appelle le parseur approprié."""
        ext = os.path.splitext(file_path)[1].lower()
        if ext == ".pdf":
            return cls.load_pdf(file_path)
        elif ext == ".docx":
            return cls.load_docx(file_path)
        elif ext in [".xlsx", ".xlsm"]:
            return cls.load_xlsx(file_path)
        elif ext == ".csv":
            return cls.load_csv(file_path)
        elif ext == ".json":
            return cls.load_json(file_path)
        else:
            return cls.load_markdown(file_path)
