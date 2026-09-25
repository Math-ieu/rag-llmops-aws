import React from 'react';
import { Activity, ShieldCheck, DollarSign, Clock, Award, CheckCircle2 } from 'lucide-react';
import { SystemHealth } from '../../types';

interface TraceInspectorProps {
  health: SystemHealth | null;
}

export const TraceInspector: React.FC<TraceInspectorProps> = ({ health }) => {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
          Observabilité, Télémétrie & Évaluation Continue
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-[70ch]">
          Supervision en temps réel des performances LLMOps : traçabilité distribuée (Langfuse),
          suivi des coûts par requête et Quality Gate anti-régression (RAGAS + LLM-as-a-Judge sur AWS Bedrock).
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Latency Card */}
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm dark:shadow-none flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Latence p95</span>
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-sky-500 dark:text-sky-400" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white">340 ms</p>
            <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-sky-500 h-full rounded-full" style={{ width: '42%' }}></div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-1">
              <span>p50: 120ms</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">SLA &lt; 800ms</span>
            </div>
          </div>
        </div>

        {/* Cost Card */}
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm dark:shadow-none flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Coût moyen / requête</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white">$0.00042</p>
            <span className="inline-block mt-2 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              Claude 3.5 Sonnet Bedrock
            </span>
          </div>
        </div>

        {/* Faithfulness Card */}
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm dark:shadow-none flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Score Fidélité (Faithfulness)</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white">0.92 <span className="text-sm font-normal text-slate-400">/ 1.0</span></p>
            <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-indigo-500 h-full rounded-full" style={{ width: '92%' }}></div>
            </div>
            <span className="block mt-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-medium">
              Seuil Quality Gate &ge; 0.85
            </span>
          </div>
        </div>

        {/* LLM Judge Card */}
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm dark:shadow-none flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Score LLM-as-a-Judge</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Award className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white">4.7 <span className="text-sm font-normal text-slate-400">/ 5.0</span></p>
            <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full" style={{ width: '94%' }}></div>
            </div>
            <span className="block mt-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-medium">
              Juge automatisé Bedrock Claude
            </span>
          </div>
        </div>
      </div>

      {/* Observability Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Langfuse Distributed Tracing */}
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm dark:shadow-none">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-orange-500 dark:text-orange-400" />
              Télémétrie Distribuée (Langfuse)
            </h3>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-mono font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Actif
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Chaque requête génère un arbre de traces avec des spans distincts pour la recherche hybride,
            le reranking, le temps jusqu'au premier token (TTFT) et le retour utilisateur.
          </p>
          <div className="space-y-2 text-xs font-mono bg-slate-50 dark:bg-[#0b0f17] p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Service Host :</span>
              <span className="font-semibold">cloud.langfuse.com</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Modèle actif :</span>
              <span className="truncate max-w-[200px] text-slate-900 dark:text-white font-medium">{health?.bedrock_llm_model}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Version du Prompt :</span>
              <span className="px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-600 dark:text-orange-400 font-semibold border border-orange-500/20">
                {health?.prompt_version}
              </span>
            </div>
          </div>
        </div>

        {/* Quality Gate CI/CD */}
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm dark:shadow-none">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-500 dark:text-sky-400" />
              CI/CD Quality Gate (Anti-Régression)
            </h3>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20 font-mono font-medium">
              GitHub Actions
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Avant chaque déploiement sur AWS, le pipeline exécute le golden dataset pour tester
            le non-décrochage de la fidélité et bloquer tout prompt induisant des hallucinations.
          </p>
          <div className="space-y-2 text-xs font-mono bg-slate-50 dark:bg-[#0b0f17] p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Golden Dataset :</span>
              <span className="font-semibold text-slate-900 dark:text-white">5 cas de test de référence</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Seuil de fidélité :</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">&ge; 0.85 (Actuel: 0.92)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Action sur régression :</span>
              <span className="text-rose-600 dark:text-rose-400 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                Merge Bloqué (Exit 1)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
