import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { SystemHealth } from '../types';

interface FooterProps {
  health: SystemHealth | null;
}

export const Footer: React.FC<FooterProps> = ({ health }) => {
  return (
    <footer className="h-9 border-t border-neutral-300 dark:border-neutral-800 bg-[#f6f6f4] dark:bg-[#0e1015] px-4 sm:px-8 flex items-center justify-between font-mono text-[11px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 select-none shrink-0">
      <div className="flex items-center gap-2 truncate">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span className="font-semibold text-neutral-800 dark:text-neutral-200">
          SYSTÈME OPÉRATIONNEL
        </span>
        <span className="hidden sm:inline opacity-40">•</span>
        <span className="hidden sm:inline">
          AWS APPRUNNER // REGION {health ? health.aws_region.toUpperCase() : 'EU-WEST-3'}
        </span>
        <span className="hidden md:inline opacity-40">•</span>
        <span className="hidden md:inline">
          {health ? health.vector_store_type.toUpperCase() : 'PGVECTOR HNSW'}
        </span>
      </div>

      <div className="flex items-center gap-4 text-[10px] font-bold text-neutral-700 dark:text-neutral-300">
        <span className="hidden lg:inline text-neutral-400 dark:text-neutral-500 font-normal">
          MODÈLE : {health ? health.bedrock_llm_model.split('.')[1] || 'CLAUDE-3.5' : 'CLAUDE-3.5'}
        </span>
        <a
          href="https://github.com/Math-ieu/rag-llmops-aws"
          target="_blank"
          rel="noreferrer"
          className="hover:text-black dark:hover:text-white flex items-center gap-0.5 transition-colors"
        >
          <span>GITHUB</span>
          <ArrowUpRight className="w-3 h-3" />
        </a>
        <a
          href="https://aws.amazon.com/bedrock/"
          target="_blank"
          rel="noreferrer"
          className="hover:text-black dark:hover:text-white flex items-center gap-0.5 transition-colors hidden sm:flex"
        >
          <span>BEDROCK</span>
          <ArrowUpRight className="w-3 h-3" />
        </a>
      </div>
    </footer>
  );
};
