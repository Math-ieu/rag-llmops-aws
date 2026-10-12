import React, { useState, useEffect, useRef } from 'react';
import { 
  UploadCloud, 
  Trash2, 
  RefreshCw, 
  Loader2, 
  FileText, 
  FileCode, 
  ArrowUpRight, 
  Plus, 
  Search, 
  X, 
  Layers, 
  Cpu, 
  Server, 
  HardDrive 
} from 'lucide-react';
import { uploadDocumentFile, fetchIndexedDocuments, deleteIndexedDocument } from '../../services/api';
import { IndexedDocument } from '../../types';

interface DocumentUploaderProps {
  onIndexedSuccess?: () => void;
}

const BADGE_COLORS = [
  'bg-blue-600 text-white',
  'bg-orange-600 text-white',
  'bg-purple-600 text-white',
  'bg-amber-600 text-white',
  'bg-teal-600 text-white',
  'bg-rose-600 text-white',
  'bg-emerald-600 text-white',
  'bg-indigo-600 text-white',
];

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({ onIndexedSuccess }) => {
  const [documents, setDocuments] = useState<IndexedDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'pdf' | 'md' | 'txt'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'recent' | 'name'>('recent');

  // État d'upload
  const [showDropzone, setShowDropzone] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<string | null>(null);

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
      setError(null);
      setProgress(0);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setProgress(15);

    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev < 85) return prev + 12;
        return prev;
      });
    }, 350);

    try {
      await uploadDocumentFile(file);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      setProgress(100);
      setTimeout(() => {
        setFile(null);
        setUploading(false);
        setShowDropzone(false);
        loadDocuments();
        onIndexedSuccess?.();
      }, 500);
    } catch (err: any) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      setError(err.message || "Erreur d'indexation.");
      setUploading(false);
    }
  };

  const handleDelete = async (docName: string) => {
    if (!confirm(`Supprimer "${docName}" (S3 et base vectorielle) ?`)) return;
    setDeletingDoc(docName);
    try {
      await deleteIndexedDocument(docName);
      setDocuments((prev) => prev.filter((d) => d.name !== docName));
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
        year: 'numeric'
      });
    } catch {
      return isoStr;
    }
  };

  // Filtrage et Tri
  const pdfCount = documents.filter((d) => d.file_type === 'pdf' || d.name.endsWith('.pdf')).length;
  const mdCount = documents.filter((d) => d.file_type === 'markdown' || d.file_type === 'md' || d.name.endsWith('.md')).length;
  const txtCount = documents.filter((d) => d.file_type === 'text' || d.file_type === 'txt' || d.name.endsWith('.txt')).length;

  const filteredDocs = documents
    .filter((d) => {
      if (filterType === 'pdf') return d.file_type === 'pdf' || d.name.endsWith('.pdf');
      if (filterType === 'md') return d.file_type === 'markdown' || d.file_type === 'md' || d.name.endsWith('.md');
      if (filterType === 'txt') return d.file_type === 'text' || d.file_type === 'txt' || d.name.endsWith('.txt');
      return true;
    })
    .filter((d) => d.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortOrder === 'name') return a.name.localeCompare(b.name);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 py-6 space-y-6">
      {/* 1. Technical Sub-Header Bar (Filtres, Tri, Recherche, Bouton Action) */}
      <div className="border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-[#0c0f17] p-2 sm:p-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        {/* Filtres Segmentés */}
        <div className="flex items-center border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 p-0.5">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 font-bold uppercase transition-all ${
              filterType === 'all'
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
            }`}
          >
            Toutes {documents.length}
          </button>
          <button
            onClick={() => setFilterType('pdf')}
            className={`px-3 py-1 font-bold uppercase transition-all border-l border-neutral-200 dark:border-neutral-800 ${
              filterType === 'pdf'
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
            }`}
          >
            PDF {pdfCount}
          </button>
          <button
            onClick={() => setFilterType('md')}
            className={`px-3 py-1 font-bold uppercase transition-all border-l border-neutral-200 dark:border-neutral-800 ${
              filterType === 'md'
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
            }`}
          >
            Markdown {mdCount}
          </button>
          <button
            onClick={() => setFilterType('txt')}
            className={`px-3 py-1 font-bold uppercase transition-all border-l border-neutral-200 dark:border-neutral-800 ${
              filterType === 'txt'
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
            }`}
          >
            Texte {txtCount}
          </button>
        </div>

        {/* Contrôles droite : Tri, Recherche, Bouton Action */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap ml-auto">
          {/* Tri */}
          <div className="flex items-center gap-1 border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 px-2 py-1 text-neutral-600 dark:text-neutral-300">
            <span className="text-[10px] text-neutral-400 uppercase">TRI</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="bg-transparent font-bold uppercase text-neutral-900 dark:text-white focus:outline-none cursor-pointer text-xs"
            >
              <option value="recent">Plus récent</option>
              <option value="name">Nom</option>
            </select>
          </div>

          {/* Recherche */}
          <div className="flex items-center gap-1.5 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-2.5 py-1 text-xs">
            <Search className="w-3.5 h-3.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent focus:outline-none w-28 sm:w-36 text-neutral-900 dark:text-white uppercase placeholder-neutral-400"
            />
          </div>

          {/* Bouton Téléverser */}
          <button
            onClick={() => setShowDropzone(!showDropzone)}
            className="px-4 py-1.5 bg-black hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-black font-mono font-bold uppercase tracking-wider text-xs transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Téléverser</span>
          </button>

          {/* Rafraîchir */}
          <button
            onClick={loadDocuments}
            disabled={loadingDocs}
            title="Rafraîchir"
            className="p-1.5 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:border-black dark:hover:border-white transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingDocs ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Zone de Dropzone Utilitarienne (Rétractable) */}
      {showDropzone && (
        <div className="border border-neutral-400 dark:border-neutral-700 border-dashed bg-white dark:bg-[#0c0f17] p-6 text-center space-y-4 animate-in fade-in duration-150 relative">
          <button
            onClick={() => setShowDropzone(false)}
            className="absolute top-3 right-3 p-1 text-neutral-400 hover:text-black dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="max-w-md mx-auto space-y-3">
            <UploadCloud className="w-8 h-8 mx-auto text-neutral-900 dark:text-white" />
            <p className="font-mono text-xs uppercase tracking-wider font-bold text-neutral-900 dark:text-white">
              Déposez un fichier pour indexation vectorielle & archivage S3
            </p>
            <p className="font-mono text-[11px] text-neutral-500">
              FORMATS : PDF, MARKDOWN, TXT (MAX 20 MO)
            </p>

            <div className="flex justify-center pt-2">
              <label className="cursor-pointer px-4 py-2 border border-black dark:border-white bg-neutral-100 dark:bg-neutral-900 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black font-mono font-bold text-xs uppercase transition-colors">
                <span>Sélectionner un fichier</span>
                <input
                  type="file"
                  accept=".pdf,.md,.txt,.markdown"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {file && (
            <div className="mt-4 p-3 border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 flex items-center justify-between text-xs font-mono max-w-lg mx-auto">
              <div className="truncate text-left pr-2">
                <span className="font-bold text-neutral-900 dark:text-white truncate block">{file.name}</span>
                <span className="text-[10px] text-neutral-500">{(file.size / 1024).toFixed(1)} Ko</span>
              </div>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-3 py-1.5 bg-black text-white dark:bg-white dark:text-black font-bold uppercase transition-colors shrink-0 disabled:opacity-50"
              >
                {uploading ? 'Traitement...' : 'Indexer'}
              </button>
            </div>
          )}

          {/* Barre de Progression Style Card 05 */}
          {uploading && (
            <div className="max-w-lg mx-auto space-y-1.5 pt-2">
              <div className="flex justify-between text-[11px] font-mono text-neutral-600 dark:text-neutral-400">
                <span>Téléversement S3 + Vectorisation Titan</span>
                <span className="font-bold">{progress}%</span>
              </div>
              <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-1.5 overflow-hidden">
                <div
                  className="bg-black dark:bg-white h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs font-mono text-rose-600 dark:text-rose-400 font-bold uppercase pt-1">
              Erreur : {error}
            </p>
          )}
        </div>
      )}

      {/* 3. Section Header 01 (Signature Industrial Brutalist) */}
      <div className="flex items-center justify-between border-b border-neutral-300 dark:border-neutral-800 pb-2 text-[11px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
        <div className="flex items-center gap-2">
          <span className="font-bold text-neutral-900 dark:text-white">01 / BASE DOCUMENTAIRE S3 & PGVECTOR</span>
        </div>
        <span>{filteredDocs.length} DOCUMENTS</span>
      </div>

      {/* 4. Modular Cards Grid (Inspiré fidèlement de la maquette utilisateur) */}
      {filteredDocs.length === 0 ? (
        <div className="p-12 text-center border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-[#0c0f17] font-mono text-xs uppercase text-neutral-400">
          Aucun document répertorié. Utilisez le bouton "Téléverser" pour indexer.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
          {filteredDocs.map((doc, idx) => {
            const isPdf = doc.file_type === 'pdf' || doc.name.endsWith('.pdf');
            const isMd = doc.file_type === 'markdown' || doc.file_type === 'md' || doc.name.endsWith('.md');
            const badgeColor = BADGE_COLORS[idx % BADGE_COLORS.length];
            const formattedIndex = String(idx + 1).padStart(2, '0');

            return (
              <div
                key={doc.id || doc.name}
                className="border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-[#0c0f17] p-3.5 flex flex-col justify-between hover:border-black dark:hover:border-neutral-600 transition-colors group relative"
              >
                {/* Haut de Carte : Badge Numéroté & Liens Techniques */}
                <div className="flex items-center justify-between pb-3">
                  <span className={`font-mono text-[10px] font-black px-1.5 py-0.5 ${badgeColor}`}>
                    {formattedIndex}
                  </span>
                  <div className="flex items-center gap-2 font-mono text-[10px] text-neutral-400 uppercase">
                    <span className="hover:text-black dark:hover:text-white flex items-center">
                      S3 <ArrowUpRight className="w-2.5 h-2.5 ml-0.5" />
                    </span>
                    <span className="hover:text-black dark:hover:text-white flex items-center">
                      PGVECTOR <ArrowUpRight className="w-2.5 h-2.5 ml-0.5" />
                    </span>
                  </div>
                </div>

                {/* Corps de Carte : Icône, Titre, Format */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                      {isPdf ? (
                        <FileText className="w-5 h-5 text-neutral-900 dark:text-white" />
                      ) : isMd ? (
                        <FileCode className="w-5 h-5 text-neutral-900 dark:text-white" />
                      ) : (
                        <FileText className="w-5 h-5 text-neutral-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-sm text-neutral-900 dark:text-white truncate" title={doc.name}>
                        {doc.name}
                      </h3>
                      <p className="text-[11px] text-neutral-500 font-mono uppercase truncate mt-0.5">
                        {doc.file_type} • {doc.chunks_count} chunks
                      </p>
                    </div>
                  </div>

                  {/* Étiquette Technique Style Dot-Matrix */}
                  <div>
                    <span className="inline-block px-1.5 py-0.5 border border-neutral-300 dark:border-neutral-700 font-mono text-[9px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900">
                      DISPONIBLE À LA RECHERCHE
                    </span>
                  </div>

                  {/* Métadonnées Taille & Date */}
                  <p className="font-mono text-[10px] text-neutral-400 uppercase">
                    {formatFileSize(doc.file_size_bytes)} • {formatDate(doc.created_at)}
                  </p>
                </div>

                {/* Actions Bas de Carte : Bouton Action Brutaliste */}
                <div className="pt-4 flex items-center gap-1.5">
                  <button
                    onClick={() => handleDelete(doc.name)}
                    disabled={deletingDoc === doc.name}
                    className="flex-1 py-1.5 bg-black hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-black font-mono font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {deletingDoc === doc.name ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="w-3 h-3" />
                        <span>Supprimer</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Section Header 02 : Spécifications Techniques RAG */}
      <div className="pt-4 space-y-3">
        <div className="flex items-center justify-between border-b border-neutral-300 dark:border-neutral-800 pb-2 text-[11px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          <span className="font-bold text-neutral-900 dark:text-white">02 / SPÉCIFICATIONS TECHNIQUES RAG</span>
          <span>4 MODULES</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 font-mono text-xs">
          <div className="border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-[#0c0f17] p-4 space-y-1">
            <div className="flex items-center justify-between text-neutral-400 text-[10px] uppercase">
              <span>01 / CHUNKING</span>
              <Layers className="w-3.5 h-3.5 text-neutral-900 dark:text-white" />
            </div>
            <p className="text-base font-bold text-neutral-900 dark:text-white">600 CAR.</p>
            <p className="text-[10px] text-neutral-500">Overlap 100 caractères</p>
          </div>

          <div className="border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-[#0c0f17] p-4 space-y-1">
            <div className="flex items-center justify-between text-neutral-400 text-[10px] uppercase">
              <span>02 / EMBEDDINGS</span>
              <Cpu className="w-3.5 h-3.5 text-neutral-900 dark:text-white" />
            </div>
            <p className="text-base font-bold text-neutral-900 dark:text-white">TITAN TEXT V2</p>
            <p className="text-[10px] text-neutral-500">1024 dimensions normalisées</p>
          </div>

          <div className="border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-[#0c0f17] p-4 space-y-1">
            <div className="flex items-center justify-between text-neutral-400 text-[10px] uppercase">
              <span>03 / STOCKAGE SOURCE</span>
              <HardDrive className="w-3.5 h-3.5 text-neutral-900 dark:text-white" />
            </div>
            <p className="text-base font-bold text-neutral-900 dark:text-white">AMAZON S3</p>
            <p className="text-[10px] text-neutral-500">Chiffrement AES256 & versioning</p>
          </div>

          <div className="border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-[#0c0f17] p-4 space-y-1">
            <div className="flex items-center justify-between text-neutral-400 text-[10px] uppercase">
              <span>04 / RECHERCHE HYBRIDE</span>
              <Server className="w-3.5 h-3.5 text-neutral-900 dark:text-white" />
            </div>
            <p className="text-base font-bold text-neutral-900 dark:text-white">PGVECTOR HNSW</p>
            <p className="text-[10px] text-neutral-500">Index Cosine + Reranking RRF</p>
          </div>
        </div>
      </div>
    </div>
  );
};
