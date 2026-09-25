import React from 'react';
import { Database, Cloud, Sun, Moon } from 'lucide-react';
import { SystemHealth } from '../types';

interface NavbarProps {
  health: SystemHealth | null;
  activeTab: 'chat' | 'ingest' | 'observability';
  setActiveTab: (tab: 'chat' | 'ingest' | 'observability') => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  health,
  activeTab,
  setActiveTab,
  theme,
  toggleTheme,
}) => {
  return (
    <header className="h-18 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#0d131f]/95 backdrop-blur px-6 sm:px-8 lg:px-10 flex items-center justify-between sticky top-0 z-40 transition-colors duration-200 shadow-sm dark:shadow-none">
      <div className="flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
          <Cloud className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-bold text-base tracking-tight text-slate-900 dark:text-white">RAG-LLMOps Platform</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 font-mono font-medium">
              AWS Bedrock
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Claude 3.5 Sonnet &bull; Titan Embeddings v2 &bull; pgvector</p>
        </div>
      </div>

      <nav className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('chat')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'chat'
              ? 'bg-white dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 shadow-sm dark:shadow-none border border-slate-200 dark:border-orange-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Chat RAG
        </button>
        <button
          onClick={() => setActiveTab('ingest')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'ingest'
              ? 'bg-white dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 shadow-sm dark:shadow-none border border-slate-200 dark:border-orange-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Ingestion & Chunks
        </button>
        <button
          onClick={() => setActiveTab('observability')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'observability'
              ? 'bg-white dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 shadow-sm dark:shadow-none border border-slate-200 dark:border-orange-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Télémétrie & Traces
        </button>
      </nav>

      <div className="flex items-center gap-3.5">
        <div className="hidden sm:flex items-center gap-4 text-xs font-mono text-slate-500 dark:text-slate-400 mr-1">
          <div className="flex items-center gap-1.5">
            <Database className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span className="font-medium">{health ? `${health.total_chunks_indexed} chunks` : 'Chargement...'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-700 dark:text-slate-300 font-semibold">{health ? health.aws_region : 'us-east-1'}</span>
          </div>
        </div>

        {/* Bouton Toggle Light / Dark */}
        <button
          onClick={toggleTheme}
          aria-label="Basculer mode clair / sombre"
          className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all border border-slate-200 dark:border-slate-700 shadow-sm"
          title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700" />
          )}
        </button>
      </div>
    </header>
  );
};
