import React, { useState } from 'react';
import { UploadCloud, CheckCircle, AlertCircle, FileText, Database } from 'lucide-react';
import { uploadDocumentFile } from '../../services/api';

interface DocumentUploaderProps {
  onIndexedSuccess?: () => void;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({ onIndexedSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const res = await uploadDocumentFile(file);
      setResult(res);
      setFile(null);
      onIndexedSuccess?.();
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'indexation.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Ingestion Documentaire & Vectorisation</h2>
        <p className="text-sm text-slate-400 mt-1">
          Téléversez vos documents (PDF, Markdown, TXT). Le pipeline découpe le texte en chunks sémantiques,
          calcule les embeddings avec Amazon Titan Embeddings v2 et les stocke dans PostgreSQL (`pgvector`).
        </p>
      </div>

      <div className="border-2 border-dashed border-slate-700/80 hover:border-orange-500/50 rounded-2xl p-8 text-center bg-slate-900/40 transition-colors">
        <UploadCloud className="w-10 h-10 text-orange-400 mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-200">
          Glissez-déposez un fichier ici ou cliquez pour parcourir
        </p>
        <p className="text-xs text-slate-500 mt-1">Formats acceptés : .pdf, .md, .txt (max 20 Mo)</p>

        <input
          type="file"
          accept=".pdf,.md,.txt,.markdown"
          onChange={handleFileChange}
          className="mt-4 block mx-auto text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-orange-500/10 file:text-orange-400 hover:file:bg-orange-500/20 cursor-pointer"
        />

        {file && (
          <div className="mt-4 p-3 bg-slate-800/80 rounded-lg flex items-center justify-between text-xs text-slate-300 max-w-md mx-auto">
            <div className="flex items-center gap-2 truncate">
              <FileText className="w-4 h-4 text-orange-400 shrink-0" />
              <span className="truncate">{file.name}</span>
            </div>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="px-3 py-1.5 rounded bg-orange-500 text-white font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors"
            >
              {uploading ? 'Vectorisation...' : 'Indexer dans pgvector'}
            </button>
          </div>
        )}
      </div>

      {result && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-semibold text-emerald-300">Document indexé avec succès !</p>
            <p className="text-slate-300 font-mono">
              Document : <span className="text-white">{result.document_name}</span> | Chunks créés :{' '}
              <span className="text-emerald-400 font-bold">{result.chunks_created}</span> | Total en base :{' '}
              <span className="text-sky-400 font-bold">{result.total_indexed_chunks}</span>
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs text-rose-300">
            <p className="font-semibold">Erreur d'ingestion</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
          <Database className="w-4 h-4 text-sky-400" />
          Stratégie de Chunking & Vectorisation
        </div>
        <ul className="text-xs text-slate-400 space-y-2 list-disc pl-4 leading-relaxed">
          <li><strong>Taille de chunk :</strong> 600 caractères avec 100 caractères de chevauchement contextuel.</li>
          <li><strong>Modèle d'embedding :</strong> Amazon Titan Text Embeddings v2 (1024 dimensions normalisées).</li>
          <li><strong>Indexation :</strong> Index HNSW (<code className="text-sky-400">vector_cosine_ops</code>) sur PostgreSQL.</li>
        </ul>
      </div>
    </div>
  );
};
