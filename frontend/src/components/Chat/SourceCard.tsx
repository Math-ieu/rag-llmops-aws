import React, { useState } from 'react';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { SourceChunk } from '../../types';

interface SourceCardProps {
  source: SourceChunk;
}

export const SourceCard: React.FC<SourceCardProps> = ({ source }) => {
  const [expanded, setExpanded] = useState(false);
  const score = source.rerank_score ?? source.similarity_score ?? 0;
  const scorePercent = Math.min(100, Math.round(score * 100));

  return (
    <div className="border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 p-2.5 text-xs font-mono transition-colors">
      <div 
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setExpanded(!expanded);
          }
        }}
      >
        <div className="flex items-center gap-2 truncate mr-2">
          <FileText className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
          <span className="font-bold text-neutral-900 dark:text-white truncate">
            {source.metadata.source}
          </span>
          <span className="text-[10px] text-neutral-400">
            [P. {source.metadata.page || 1}]
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="px-1.5 py-0.5 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-[10px] font-bold text-neutral-700 dark:text-neutral-300">
            {scorePercent}% MATCH
          </span>
          <div className="text-neutral-400">
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-800 text-[11px] leading-relaxed text-neutral-700 dark:text-neutral-300 bg-white dark:bg-black p-2.5 border border-neutral-200 dark:border-neutral-800">
          {source.content}
        </div>
      )}
    </div>
  );
};
