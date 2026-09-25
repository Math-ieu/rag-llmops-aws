import React from 'react';
import { Activity, ShieldCheck, DollarSign, Clock, Award, CheckCircle2, ChevronRight, Zap, Database, BarChart3 } from 'lucide-react';
import { SystemHealth } from '../../types';

interface TraceInspectorProps {
  health: SystemHealth | null;
}

export const TraceInspector: React.FC<TraceInspectorProps> = ({ health }) => {
  return (
    <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-8 space-y-8">
      {/* En-tête concis */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Observabilité, Télémétrie & Évaluation
        </h2>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1.5">
          Monitoring en direct des performances RAG, coûts AWS Bedrock et Quality Gate CI/CD.
        </p>
      </div>

      {/* KPI Cards Grid - Scannable & Clear */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Latency Card */}
        <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-none flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-sm font-semibold">
            <span>Latence p95</span>
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-sky-500 dark:text-sky-400" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl sm:text-4xl font-extrabold font-mono text-slate-900 dark:text-white">340 ms</p>
            <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-sky-500 h-full rounded-full transition-all duration-500" style={{ width: '42%' }}></div>
            </div>
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-mono mt-2">
              <span>p50: 120ms</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">SLA &lt; 800ms</span>
            </div>
          </div>
        </div>

        {/* Cost Card */}
        <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-none flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-sm font-semibold">
            <span>Coût moyen / req</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl sm:text-4xl font-extrabold font-mono text-slate-900 dark:text-white">$0.00042</p>
            <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: '28%' }}></div>
            </div>
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-mono mt-2">
              <span>Claude 3.5 Sonnet</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Budget OK</span>
            </div>
          </div>
        </div>

        {/* Faithfulness Card */}
        <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-none flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-sm font-semibold">
            <span>Fidélité (Faithfulness)</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl sm:text-4xl font-extrabold font-mono text-slate-900 dark:text-white">
              0.92 <span className="text-base font-normal text-slate-400">/ 1.0</span>
            </p>
            <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: '92%' }}></div>
            </div>
            <div className="flex justify-between text-xs font-mono mt-2">
              <span className="text-slate-500 dark:text-slate-400">RAGAS Hallucination</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">&ge; 0.85</span>
            </div>
          </div>
        </div>

        {/* LLM Judge Card */}
        <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-none flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-sm font-semibold">
            <span>LLM-as-a-Judge</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Award className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl sm:text-4xl font-extrabold font-mono text-slate-900 dark:text-white">
              4.7 <span className="text-base font-normal text-slate-400">/ 5.0</span>
            </p>
            <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: '94%' }}></div>
            </div>
            <div className="flex justify-between text-xs font-mono mt-2">
              <span className="text-slate-500 dark:text-slate-400">Bedrock Claude</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Conforme</span>
            </div>
          </div>
        </div>
      </div>

      {/* Observability Details Grid - Clean & Direct */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Langfuse Distributed Tracing */}
        <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm dark:shadow-none">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-orange-500 dark:text-orange-400" />
              Télémétrie Distribuée (Langfuse)
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-mono font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Actif
            </span>
          </div>

          <div className="space-y-2.5 text-xs sm:text-sm font-mono bg-slate-50 dark:bg-[#0b0f17] p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-800/60">
              <span className="text-slate-500">Service :</span>
              <span className="font-semibold text-slate-900 dark:text-white">cloud.langfuse.com</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-800/60">
              <span className="text-slate-500">Modèle LLM :</span>
              <span className="truncate max-w-[280px] text-slate-900 dark:text-white font-medium">{health?.bedrock_llm_model}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-800/60">
              <span className="text-slate-500">Embeddings :</span>
              <span className="truncate max-w-[280px] text-slate-900 dark:text-white font-medium">{health?.bedrock_embedding_model}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500">Version Prompt :</span>
              <span className="px-2 py-0.5 rounded bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold border border-orange-500/20">
                {health?.prompt_version}
              </span>
            </div>
          </div>
        </div>

        {/* Quality Gate CI/CD */}
        <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm dark:shadow-none">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-500 dark:text-sky-400" />
              CI/CD Quality Gate
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20 font-mono font-medium">
              GitHub Actions
            </span>
          </div>

          <div className="space-y-2.5 text-xs sm:text-sm font-mono bg-slate-50 dark:bg-[#0b0f17] p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-800/60">
              <span className="text-slate-500">Golden Dataset :</span>
              <span className="font-semibold text-slate-900 dark:text-white">5 cas annotés</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-800/60">
              <span className="text-slate-500">Seuil Fidélité :</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">&ge; 0.85 (Actuel: 0.92)</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-800/60">
              <span className="text-slate-500">Seuil LLM Judge :</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold">&ge; 3.8 / 5.0 (Actuel: 4.7)</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500">Régression :</span>
              <span className="text-rose-600 dark:text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                Merge Bloqué
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline Flow Bar - Visual & Minimalist */}
      <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-none">
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs sm:text-sm font-medium">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
            <Database className="w-4 h-4 text-sky-500" />
            <span>Recherche Hybride (BM25 + pgvector)</span>
          </div>

          <ChevronRight className="w-4 h-4 text-slate-400 hidden md:block shrink-0" />

          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
            <Zap className="w-4 h-4 text-orange-500" />
            <span>Converse Bedrock & Claude 3.5 (SSE)</span>
          </div>

          <ChevronRight className="w-4 h-4 text-slate-400 hidden md:block shrink-0" />

          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
            <BarChart3 className="w-4 h-4 text-emerald-500" />
            <span>Télémétrie Langfuse & Évaluation</span>
          </div>
        </div>
      </div>
    </div>
  );
};
