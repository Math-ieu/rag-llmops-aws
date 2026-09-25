import React, { useState } from 'react';
import { UploadCloud, CheckCircle, AlertCircle, FileText, Database, Layers, Cpu, Server } from 'lucide-react';
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
    <div className="w-full max-w-6xl mx-auto px-6 sm:px-8 lg:px-10 py-8 space-y-8">
      {/* En-tête élargi */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Ingestion Documentaire & Vectorisation
        </h2>
        <p className="text-base text-slate-600 dark:text-slate-400 mt-2 max-w-3xl leading-relaxed">
          Téléversez vos documents sources (PDF, Markdown, TXT). Le pipeline découpe le texte en chunks sémantiques,
          calcule les embeddings vectoriels avec Amazon Titan Embeddings v2 et les persiste dans PostgreSQL (<code className="text-orange-600 dark:text-orange-400 font-mono">pgvector</code>).
        </p>
      </div>

      {/* Zone de Dropzone Agrandie */}
      <div className="border-2 border-dashed border-slate-300 dark:border-slate-700/80 hover:border-orange-500 rounded-3xl p-12 sm:p-16 text-center bg-white dark:bg-slate-900/40 transition-all shadow-sm dark:shadow-none group">
        <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform">
          <UploadCloud className="w-9 h-9 text-orange-500 dark:text-orange-400" />
        </div>
        
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
          Glissez-déposez vos fichiers ici ou parcourez votre disque
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          Formats acceptés : PDF, Markdown (.md), Fichiers texte brut (.txt) • Jusqu'à 20 Mo par document
        </p>

        <div className="mt-6 flex justify-center">
          <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30 text-sm font-semibold transition-all shadow-sm">
            <span>Sélectionner un fichier</span>
            <input
              type="file"
              accept=".pdf,.md,.txt,.markdown"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>

        {file && (
          <div className="mt-6 p-4 bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between text-sm text-slate-800 dark:text-slate-200 max-w-lg mx-auto shadow-sm">
            <div className="flex items-center gap-3 truncate mr-3">
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="truncate text-left">
                <p className="font-semibold truncate">{file.name}</p>
                <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} Ko</p>
              </div>
            </div>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="px-5 py-2.5 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 disabled:opacity-50 transition-colors shadow-md shrink-0"
            >
              {uploading ? 'Vectorisation...' : 'Indexer dans pgvector'}
            </button>
          </div>
        )}
      </div>

      {/* Résultat d'ingestion réussi */}
      {result && (
        <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-4">
          <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <h4 className="font-bold text-emerald-800 dark:text-emerald-300 text-base">Document indexé avec succès !</h4>
            <p className="text-sm text-slate-700 dark:text-slate-300 font-mono">
              Document : <span className="text-slate-900 dark:text-white font-bold">{result.document_name}</span> &bull; Chunks créés :{' '}
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{result.chunks_created}</span> &bull; Total en base vectorielle :{' '}
              <span className="text-sky-600 dark:text-sky-400 font-bold">{result.total_indexed_chunks} chunks</span>
            </p>
          </div>
        </div>
      )}

      {/* Erreur d'ingestion */}
      {error && (
        <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="text-sm text-rose-700 dark:text-rose-300">
            <h4 className="font-bold text-base">Erreur lors de l'ingestion</h4>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Stratégie Architecture en 3 Colonnes Agrandie */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Database className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          Spécifications Techniques du Pipeline d'Ingestion
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-sm dark:shadow-none">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <Layers className="w-5 h-5 text-orange-500 dark:text-orange-400" />
            </div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">Chunking Sémantique</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Découpage par fenêtres de <strong>600 caractères</strong> avec <strong>100 caractères de recouvrement</strong> (overlap) pour préserver la continuité contextuelle entre segments adjacents.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-sm dark:shadow-none">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-sky-500 dark:text-sky-400" />
            </div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">Amazon Titan Embeddings v2</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Calcul de vecteurs denses normalisés en <strong>1024 dimensions</strong>. Précision sémantique maximale pour la recherche par similarité cosinus.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-sm dark:shadow-none">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Server className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
            </div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">Indexation HNSW pgvector</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Stockage dans PostgreSQL avec extension <code className="text-emerald-600 dark:text-emerald-400 font-mono">pgvector</code> et index HNSW (<code className="font-mono">vector_cosine_ops</code>) pour des requêtes sub-milliseconde.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
