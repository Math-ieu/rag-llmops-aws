import React, { useState } from 'react';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { SourceChunk } from '../../types';

interface SourceCardProps {
  source: SourceChunk;
  index?: number;
}

export const SourceCard: React.FC<SourceCardProps> = ({ source }) => {
  const [expanded, setExpanded] = useState(false);
  const score = source.rerank_score ?? source.similarity_score ?? 0;
  const scorePercent = Math.min(100, Math.round(score * 100));

  const getScoreBadge = (pct: number) => {
    if (pct >= 60) {
      return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20';
    }
    if (pct >= 30) {
      return 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20';
    }
    return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20';
  };

  return (
    <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 rounded-xl p-3 text-xs transition-all hover:border-slate-300 dark:hover:border-slate-700 shadow-sm dark:shadow-none">
      <div 
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        className="flex items-center justify-between cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-lg"
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setExpanded(!expanded);
          }
        }}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-6 h-6 rounded-md bg-orange-500/10 flex items-center justify-center shrink-0">
            <FileText className="w-3.5 h-3.5 text-orange-500 dark:text-orange-400" />
          </div>
          <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
            {source.metadata.source} (page {source.metadata.page || 1})
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border ${getScoreBadge(scorePercent)}`}>
            {scorePercent}% match
          </span>
          <div className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] leading-relaxed bg-slate-50/80 dark:bg-[#0b0f17]/60 p-3 rounded-lg border border-slate-200/60 dark:border-slate-800/80">
          {source.content}
        </div>
      )}
    </div>
  );
};
