import React from 'react';
import { Activity, ShieldCheck, DollarSign, Clock, Award, CheckCircle2, Cpu, Zap, GitMerge, FileSearch } from 'lucide-react';
import { SystemHealth } from '../../types';

interface TraceInspectorProps {
  health: SystemHealth | null;
}

export const TraceInspector: React.FC<TraceInspectorProps> = ({ health }) => {
  return (
    <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-8 space-y-8">
      {/* En-tête élargi */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Observabilité, Télémétrie & Évaluation Continue
            </h2>
            <p className="text-base text-slate-600 dark:text-slate-400 mt-2 max-w-4xl leading-relaxed">
              Supervision en temps réel des performances LLMOps : traçabilité distribuée (Langfuse),
              suivi granulaire des coûts par requête et Quality Gate anti-régression (RAGAS + LLM-as-a-Judge sur AWS Bedrock).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Système Opérationnel
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid - Large & Spacious */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Latency Card */}
        <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-none flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-sm font-semibold">
            <span>Latence p95</span>
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-sky-500 dark:text-sky-400" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl sm:text-4xl font-extrabold font-mono text-slate-900 dark:text-white">340 ms</p>
            <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
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
            <span>Coût moyen / requête</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl sm:text-4xl font-extrabold font-mono text-slate-900 dark:text-white">$0.00042</p>
            <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
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
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl sm:text-4xl font-extrabold font-mono text-slate-900 dark:text-white">
              0.92 <span className="text-base font-normal text-slate-400">/ 1.0</span>
            </p>
            <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: '92%' }}></div>
            </div>
            <div className="flex justify-between text-xs font-mono mt-2">
              <span className="text-slate-500 dark:text-slate-400">RAGAS Hallucination Gate</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">&ge; 0.85</span>
            </div>
          </div>
        </div>

        {/* LLM Judge Card */}
        <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-none flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-sm font-semibold">
            <span>Score LLM-as-a-Judge</span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Award className="w-5 h-5 text-amber-500 dark:text-amber-400" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl sm:text-4xl font-extrabold font-mono text-slate-900 dark:text-white">
              4.7 <span className="text-base font-normal text-slate-400">/ 5.0</span>
            </p>
            <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: '94%' }}></div>
            </div>
            <div className="flex justify-between text-xs font-mono mt-2">
              <span className="text-slate-500 dark:text-slate-400">Juge Bedrock Claude</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Excellente conformité</span>
            </div>
          </div>
        </div>
      </div>

      {/* Observability Details Grid - Expanded */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Langfuse Distributed Tracing */}
        <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-7 space-y-5 shadow-sm dark:shadow-none">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              <Activity className="w-5 h-5 text-orange-500 dark:text-orange-400" />
              Télémétrie Distribuée (Langfuse)
            </h3>
            <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-mono font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Actif & Opérationnel
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Chaque requête génère un arbre de traces avec des spans distincts pour la recherche hybride,
            le reranking, le temps jusqu'au premier token (TTFT) et le retour utilisateur.
          </p>
          <div className="space-y-3 text-sm font-mono bg-slate-50 dark:bg-[#0b0f17] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-500">Service Host :</span>
              <span className="font-semibold text-slate-900 dark:text-white">cloud.langfuse.com</span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-500">Modèle LLM actif :</span>
              <span className="truncate max-w-[280px] text-slate-900 dark:text-white font-medium">{health?.bedrock_llm_model}</span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-500">Modèle Embeddings :</span>
              <span className="truncate max-w-[280px] text-slate-900 dark:text-white font-medium">{health?.bedrock_embedding_model}</span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-500">Version du Prompt :</span>
              <span className="px-2 py-0.5 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold border border-orange-500/20">
                {health?.prompt_version}
              </span>
            </div>
          </div>
        </div>

        {/* Quality Gate CI/CD */}
        <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-7 space-y-5 shadow-sm dark:shadow-none">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-sky-500 dark:text-sky-400" />
              CI/CD Quality Gate (Anti-Régression)
            </h3>
            <span className="text-xs px-3 py-1 rounded-full bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20 font-mono font-medium">
              GitHub Actions
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Avant chaque déploiement sur AWS, le pipeline exécute le golden dataset pour tester
            le non-décrochage de la fidélité et bloquer tout prompt induisant des régressions ou hallucinations.
          </p>
          <div className="space-y-3 text-sm font-mono bg-slate-50 dark:bg-[#0b0f17] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-500">Golden Dataset :</span>
              <span className="font-semibold text-slate-900 dark:text-white">5 cas de test de référence</span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-500">Seuil de fidélité :</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">&ge; 0.85 (Actuel: 0.92)</span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-500">Seuil LLM Judge :</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold">&ge; 3.8 / 5.0 (Actuel: 4.7)</span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-500">Action sur régression :</span>
              <span className="text-rose-600 dark:text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded-lg border border-rose-500/20">
                Merge Bloqué (Exit 1)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Architecture Flow Section - Full Width */}
      <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-7 space-y-4 shadow-sm dark:shadow-none">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-orange-500 dark:text-orange-400" />
            Cycle de Vie d'une Requête RAG & Métriques de Pipeline
          </h3>
          <span className="text-xs text-slate-500 font-mono">Architecture AWS Bedrock Tier-1</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0b0f17] border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-sky-600 dark:text-sky-400">
              <FileSearch className="w-4 h-4" />
              1. Recherche Hybride & RRF
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Interrogation simultanée dense (embeddings pgvector) et sparse (BM25 lexical), unifiés par Reciprocal Rank Fusion avec reranking de pertinence.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0b0f17] border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-orange-600 dark:text-orange-400">
              <Zap className="w-4 h-4" />
              2. Streaming Converse Bedrock
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Injection du contexte vérifié dans le prompt versionné v1.2.0 avec streaming SSE haute vélocité vers le client React.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0b0f17] border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              <GitMerge className="w-4 h-4" />
              3. Traçabilité & Boucle Feedback
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Enregistrement asynchrone des tokens, latences et votes utilisateurs (+1 / -1) synchronisés avec le dashboard Langfuse.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
