import { Sun, Moon, Terminal } from 'lucide-react';
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
    <header className="h-14 border-b border-neutral-300 dark:border-neutral-800 bg-[#f6f6f4] dark:bg-[#0e1015] px-4 sm:px-8 flex items-center justify-between sticky top-0 z-40 select-none">
      {/* Brand - Left */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 font-black text-sm tracking-wider uppercase text-neutral-900 dark:text-white">
          <Terminal className="w-4 h-4 text-neutral-900 dark:text-white" />
          <span>RAG // CORE</span>
        </div>
        <div className="hidden md:flex items-center gap-1 font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-black text-white dark:bg-white dark:text-black">
          <span>AWS BEDROCK</span>
          <span className="opacity-60">//</span>
          <span>LLMOPS</span>
        </div>
      </div>

      {/* Tabs - Centered segmented controls */}
      <nav className="flex items-center border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-0.5 font-mono text-xs">
        <button
          onClick={() => setActiveTab('chat')}
          className={`px-3.5 py-1.5 font-bold uppercase tracking-wider transition-all ${
            activeTab === 'chat'
              ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
          }`}
        >
          01 Chat
        </button>
        <button
          onClick={() => setActiveTab('ingest')}
          className={`px-3.5 py-1.5 font-bold uppercase tracking-wider transition-all border-l border-neutral-200 dark:border-neutral-800 ${
            activeTab === 'ingest'
              ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
          }`}
        >
          02 Ingestion
        </button>
        <button
          onClick={() => setActiveTab('observability')}
          className={`px-3.5 py-1.5 font-bold uppercase tracking-wider transition-all border-l border-neutral-200 dark:border-neutral-800 ${
            activeTab === 'observability'
              ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
          }`}
        >
          03 Télémétrie
        </button>
      </nav>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5 font-mono text-[11px]">
        <div className="hidden sm:flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
          <span className="px-2 py-1 border border-neutral-300 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-neutral-900 dark:text-white">
              {health ? health.aws_region.toUpperCase() : 'EU-WEST-3'}
            </span>
          </span>
          <span className="px-2 py-1 border border-neutral-300 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 font-semibold text-neutral-800 dark:text-neutral-200">
            {health ? `${health.total_chunks_indexed} CHUNKS` : '0 CHUNKS'}
          </span>
        </div>

        {/* Bouton Toggle Light / Dark */}
        <button
          onClick={toggleTheme}
          aria-label="Basculer thème"
          title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
          className="p-1.5 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:border-black dark:hover:border-white transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-neutral-800" />}
        </button>
      </div>
    </header>
  );
};
