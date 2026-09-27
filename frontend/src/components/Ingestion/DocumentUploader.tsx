import React, { useState } from 'react';
import { UploadCloud, CheckCircle, AlertCircle, FileText, Layers, Cpu, Server } from 'lucide-react';
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
      {/* En-tête concis */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Ingestion
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Ajout de documents à la base vectorielle.
        </p>
      </div>

      {/* Zone de Dropzone */}
      <div className="border-2 border-dashed border-slate-300 dark:border-slate-700/80 hover:border-orange-500 rounded-3xl p-12 text-center bg-white dark:bg-slate-900/40 transition-all shadow-sm dark:shadow-none group">
        <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
          <UploadCloud className="w-8 h-8 text-orange-500 dark:text-orange-400" />
        </div>
        
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          Déposez un fichier ici
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          PDF, Markdown, TXT (max 20 Mo)
        </p>

        <div className="mt-5 flex justify-center">
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
              className="px-4 py-2 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600 disabled:opacity-50 transition-colors shadow-sm shrink-0"
            >
              {uploading ? 'Indexation...' : 'Indexer'}
            </button>
          </div>
        )}
      </div>

      {/* Résultat d'ingestion */}
      {result && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-mono">
            Indexé : <span className="font-bold text-slate-900 dark:text-white">{result.document_name}</span> &bull;{' '}
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">{result.chunks_created} chunks créés</span> &bull; Total :{' '}
            <span className="text-sky-600 dark:text-sky-400 font-bold">{result.total_indexed_chunks} chunks</span>
          </p>
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0" />
          <p className="text-xs sm:text-sm text-rose-700 dark:text-rose-300 font-medium">Erreur : {error}</p>
        </div>
      )}

      {/* Spécifications - Essentiel uniquement */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-none">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 uppercase tracking-wider">
            <Layers className="w-4 h-4 text-orange-500" />
            <span>Chunking</span>
          </div>
          <p className="text-lg font-bold text-slate-900 dark:text-white mt-2">
            600 car. <span className="text-xs font-normal text-slate-400">(overlap 100)</span>
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-none">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 uppercase tracking-wider">
            <Cpu className="w-4 h-4 text-sky-500" />
            <span>Embedding</span>
          </div>
          <p className="text-lg font-bold text-slate-900 dark:text-white mt-2">
            Titan Text v2 <span className="text-xs font-normal text-slate-400">(1024d)</span>
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-none">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 uppercase tracking-wider">
            <Server className="w-4 h-4 text-emerald-500" />
            <span>Base Vectorielle</span>
          </div>
          <p className="text-lg font-bold text-slate-900 dark:text-white mt-2">
            pgvector <span className="text-xs font-normal text-slate-400">(HNSW)</span>
          </p>
        </div>
      </div>
    </div>
  );
};
