import React, { useState, useEffect, useRef } from 'react';
import { 
  UploadCloud, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  Layers, 
  Cpu, 
  Server, 
  Trash2, 
  RefreshCw, 
  Loader2, 
  FileCode, 
  Clock 
} from 'lucide-react';
import { uploadDocumentFile, fetchIndexedDocuments, deleteIndexedDocument } from '../../services/api';
import { IndexedDocument } from '../../types';

interface DocumentUploaderProps {
  onIndexedSuccess?: () => void;
}

const STEPS = [
  'Lecture du fichier',
  'Archivage Amazon S3',
  'Vectorisation Titan',
  'Indexation pgvector'
];

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({ onIndexedSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<IndexedDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [deletingDoc, setDeletingDoc] = useState<string | null>(null);
  const [docToDelete, setDocToDelete] = useState<string | null>(null);

  const progressIntervalRef = useRef<any>(null);

  const loadDocuments = async () => {
    setLoadingDocs(true);
    try {
      const data = await fetchIndexedDocuments();
      setDocuments(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setError(null);
      setProgress(0);
      setActiveStep(0);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setResult(null);
    setProgress(10);
    setActiveStep(0);

    // Simulation fluide de progression pendant le traitement API
    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev < 30) {
          setActiveStep(1);
          return prev + 5;
        } else if (prev < 75) {
          setActiveStep(2);
          return prev + 3;
        } else if (prev < 90) {
          setActiveStep(3);
          return prev + 1;
        }
        return prev;
      });
    }, 400);

    try {
      const res = await uploadDocumentFile(file);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      setProgress(100);
      setActiveStep(3);
      setResult(res);
      setFile(null);
      await loadDocuments();
      onIndexedSuccess?.();
    } catch (err: any) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      setError(err.message || "Erreur lors de l'indexation.");
    } finally {
      setUploading(false);
    }
  };

  const confirmDelete = async () => {
    if (!docToDelete) return;
    const name = docToDelete;
    setDeletingDoc(name);
    try {
      await deleteIndexedDocument(name);
      setDocuments((prev) => prev.filter((d) => d.name !== name));
      setDocToDelete(null);
      onIndexedSuccess?.();
    } catch (err: any) {
      alert("Erreur lors de la suppression : " + err.message);
    } finally {
      setDeletingDoc(null);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-6 sm:px-8 lg:px-10 py-8 space-y-8">
      {/* En-tête concis */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Ingestion & Documents
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Ajout et suivi des documents dans la base vectorielle.
          </p>
        </div>
        <button
          onClick={loadDocuments}
          disabled={loadingDocs}
          title="Rafraîchir"
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loadingDocs ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Zone de Dropzone */}
      <div className="border-2 border-dashed border-slate-300 dark:border-slate-700/80 hover:border-orange-500 rounded-3xl p-10 text-center bg-white dark:bg-slate-900/40 transition-all shadow-sm dark:shadow-none group">
        <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
          <UploadCloud className="w-8 h-8 text-orange-500 dark:text-orange-400" />
        </div>
        
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          Déposez un fichier ici
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          PDF, Word (DOCX), Excel (XLSX), CSV, JSON, Markdown, TXT (max 20 Mo)
        </p>

        <div className="mt-5 flex justify-center">
          <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30 text-sm font-semibold transition-all shadow-sm">
            <span>Sélectionner un fichier</span>
            <input
              type="file"
              accept=".pdf,.docx,.xlsx,.xlsm,.csv,.json,.md,.txt,.markdown"
              onChange={handleFileChange}
              disabled={uploading}
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
              className="px-4 py-2 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600 disabled:opacity-50 transition-colors shadow-sm shrink-0 flex items-center gap-1.5"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Indexation...</span>
                </>
              ) : (
                <span>Indexer</span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Barre & Stepper de Progression en direct */}
      {uploading && (
        <div className="p-6 bg-white dark:bg-slate-900/70 border border-orange-500/30 rounded-2xl shadow-sm space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                Indexation en cours : {STEPS[activeStep]}
              </span>
            </div>
            <span className="font-mono text-xs font-bold text-orange-600 dark:text-orange-400">
              {progress}%
            </span>
          </div>

          {/* Barre de progression */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* 4 Étapes visuelles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            {STEPS.map((step, idx) => {
              const isDone = idx < activeStep || progress === 100;
              const isCurrent = idx === activeStep && progress < 100;
              return (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border text-xs font-mono transition-all ${
                    isDone
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                      : isCurrent
                      ? 'bg-orange-500/10 border-orange-500/40 text-orange-600 dark:text-orange-400 font-semibold'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    {isDone ? (
                      <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                    ) : isCurrent ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                    ) : (
                      <span className="w-3.5 h-3.5 rounded-full border border-current flex items-center justify-center text-[9px] shrink-0">
                        {idx + 1}
                      </span>
                    )}
                    <span className="truncate">{step}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Résultat d'ingestion */}
      {result && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-mono">
              Indexé : <span className="font-bold text-slate-900 dark:text-white">{result.document_name}</span> &bull;{' '}
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{result.chunks_created} chunks créés</span> &bull; Total :{' '}
              <span className="text-sky-600 dark:text-sky-400 font-bold">{result.total_indexed_chunks} chunks</span>
            </p>
          </div>
          <button
            onClick={() => setResult(null)}
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-mono"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0" />
          <p className="text-xs sm:text-sm text-rose-700 dark:text-rose-300 font-medium">Erreur : {error}</p>
        </div>
      )}

      {/* Spécifications Minimalistes */}
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

      {/* Historique des Documents Indexés */}
      <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-none space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Documents indexés
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-mono text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              {documents.length}
            </span>
          </div>
        </div>

        {documents.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500 font-mono">
            Aucun document dans la base vectorielle. Déposez un fichier ci-dessus.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-mono text-xs uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Document</th>
                  <th className="pb-3 font-semibold">Format</th>
                  <th className="pb-3 font-semibold">Chunks</th>
                  <th className="pb-3 font-semibold">Taille</th>
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold">Statut</th>
                  <th className="pb-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-xs">
                {documents.map((doc) => {
                  const isPdf = doc.file_type === 'pdf' || doc.name.endsWith('.pdf');
                  const isMd = doc.file_type === 'markdown' || doc.name.endsWith('.md');
                  return (
                    <tr key={doc.id || doc.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 pr-4">
                        <div className="flex items-center gap-2.5 truncate max-w-xs sm:max-w-md">
                          {isPdf ? (
                            <FileText className="w-4 h-4 text-orange-500 shrink-0" />
                          ) : isMd ? (
                            <FileCode className="w-4 h-4 text-sky-500 shrink-0" />
                          ) : (
                            <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                          <span className="font-semibold text-slate-900 dark:text-white truncate">
                            {doc.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 pr-4 text-slate-500 uppercase">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-[11px]">
                          {doc.file_type}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4 text-slate-700 dark:text-slate-300 font-semibold">
                        {doc.chunks_count}
                      </td>
                      <td className="py-3.5 pr-4 text-slate-500">
                        {formatFileSize(doc.file_size_bytes)}
                      </td>
                      <td className="py-3.5 pr-4 text-slate-400 flex items-center gap-1.5 mt-2.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{formatDate(doc.created_at)}</span>
                      </td>
                      <td className="py-3.5 pr-4">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold flex items-center gap-1 w-fit">
                          <CheckCircle className="w-2.5 h-2.5" />
                          <span>Indexé</span>
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <button
                          onClick={() => setDocToDelete(doc.name)}
                          disabled={deletingDoc === doc.name}
                          title="Supprimer le document"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                        >
                          {deletingDoc === doc.name ? (
                            <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pop-up Modal de Confirmation de Suppression */}
      {docToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-base text-slate-900 dark:text-white">
                  Supprimer le document
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Action irréversible
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Voulez-vous supprimer définitivement <span className="font-semibold text-slate-900 dark:text-white font-mono break-all">"{docToDelete}"</span> d'Amazon S3 et de la base vectorielle pgvector ?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setDocToDelete(null)}
                disabled={deletingDoc !== null}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                disabled={deletingDoc !== null}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md shadow-rose-600/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {deletingDoc ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Suppression...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Supprimer</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
