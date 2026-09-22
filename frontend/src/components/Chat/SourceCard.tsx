import React, { useState } from 'react';
import { FileText, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { SourceChunk } from '../../types';

interface SourceCardProps {
  source: SourceChunk;
  index: number;
}

export const SourceCard: React.FC<SourceCardProps> = ({ source, index }) => {
  const [expanded, setExpanded] = useState(false);
  const score = source.rerank_score ?? source.similarity_score ?? 0;
  const scorePercent = Math.round(score * 100);

  return (
    <div className="border border-slate-800 bg-slate-900/60 rounded-lg p-2.5 text-xs transition-colors hover:border-slate-700">
      <div 
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <FileText className="w-3.5 h-3.5 text-orange-400 shrink-0" />
          <span className="font-medium text-slate-200 truncate">
            {source.metadata.source} (p. {source.metadata.page || 1})
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-sky-500/10 text-sky-400 border border-sky-500/20">
            {scorePercent}% match
          </span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
        </div>
      </div>

      {expanded && (
        <div className="mt-2 pt-2 border-t border-slate-800 text-slate-300 font-mono text-[11px] leading-relaxed bg-[#0b0f17]/50 p-2 rounded">
          {source.content}
        </div>
      )}
    </div>
  );
};
