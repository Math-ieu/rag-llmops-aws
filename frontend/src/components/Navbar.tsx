import React from 'react';
import { Database, Cloud, Sun, Moon, MessageSquare, UploadCloud, Activity } from 'lucide-react';
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
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#0d131f]/95 backdrop-blur px-6 sm:px-8 lg:px-10 flex items-center justify-between sticky top-0 z-40 transition-colors duration-200 shadow-sm dark:shadow-none relative">
      {/* Brand - Left */}
      <div className="flex items-center gap-3.5 z-10">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
          <Cloud className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white">RAG-LLMOps Platform</h1>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 font-mono font-medium">
              AWS Bedrock
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">Claude 3.5 Sonnet &bull; Titan Embeddings v2 &bull; pgvector</p>
        </div>
      </div>

      {/* Tabs - Centered mathematically in the navbar */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center">
        <nav className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/90 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 flex items-center gap-2 ${
              activeTab === 'chat'
                ? 'bg-white dark:bg-slate-800 text-orange-600 dark:text-orange-400 shadow-sm border border-slate-200/80 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat RAG</span>
          </button>
          <button
            onClick={() => setActiveTab('ingest')}
            className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 flex items-center gap-2 ${
              activeTab === 'ingest'
                ? 'bg-white dark:bg-slate-800 text-orange-600 dark:text-orange-400 shadow-sm border border-slate-200/80 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Ingestion & Chunks</span>
          </button>
          <button
            onClick={() => setActiveTab('observability')}
            className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 flex items-center gap-2 ${
              activeTab === 'observability'
                ? 'bg-white dark:bg-slate-800 text-orange-600 dark:text-orange-400 shadow-sm border border-slate-200/80 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Télémétrie & Traces</span>
          </button>
        </nav>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3.5 z-10 ml-auto">
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
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all border border-slate-200 dark:border-slate-700 shadow-sm"
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
