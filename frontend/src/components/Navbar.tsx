import React from 'react';
import { Activity, ShieldCheck, Database, Cpu, Cloud } from 'lucide-react';
import { SystemHealth } from '../types';

interface NavbarProps {
  health: SystemHealth | null;
  activeTab: 'chat' | 'ingest' | 'observability';
  setActiveTab: (tab: 'chat' | 'ingest' | 'observability') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ health, activeTab, setActiveTab }) => {
  return (
    <header className="h-16 border-b border-slate-800 bg-[#0d131f]/90 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
          <Cloud className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-semibold text-sm tracking-wide text-white">RAG-LLMOps Platform</h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 font-mono">
              AWS Bedrock
            </span>
          </div>
          <p className="text-xs text-slate-400">Claude 3.5 Sonnet • Titan Embeddings v2 • pgvector</p>
        </div>
      </div>

      <nav className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800">
        <button
          onClick={() => setActiveTab('chat')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            activeTab === 'chat'
              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Chat RAG
        </button>
        <button
          onClick={() => setActiveTab('ingest')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            activeTab === 'ingest'
              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Ingestion & Chunks
        </button>
        <button
          onClick={() => setActiveTab('observability')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            activeTab === 'observability'
              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Télémétrie & Traces
        </button>
      </nav>

      <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
        <div className="flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-sky-400" />
          <span>{health ? `${health.total_chunks_indexed} chunks` : 'Chargement...'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-slate-300">{health ? health.aws_region : 'us-east-1'}</span>
        </div>
      </div>
    </header>
  );
};
