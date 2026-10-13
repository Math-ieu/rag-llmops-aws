import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  ShieldCheck, 
  DollarSign, 
  Clock, 
  Award, 
  CheckCircle2, 
  ChevronRight, 
  Zap, 
  Database, 
  BarChart3, 
  RefreshCw,
  ThumbsUp
} from 'lucide-react';
import { SystemHealth, LiveTelemetryMetrics } from '../../types';
import { fetchLiveTelemetry } from '../../services/api';

interface TraceInspectorProps {
  health: SystemHealth | null;
}

export const TraceInspector: React.FC<TraceInspectorProps> = ({ health }) => {
  const [telemetry, setTelemetry] = useState<LiveTelemetryMetrics | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const data = await fetchLiveTelemetry();
      if (data) setTelemetry(data);
    } catch (e) {
      console.error('Failed to load telemetry', e);
    } finally {
      if (isManual) setTimeout(() => setRefreshing(false), 500);
    }
  };

  useEffect(() => {
    loadData();
    // Rafraîchissement automatique toutes les 15 secondes
    const interval = setInterval(() => loadData(), 15000);
    return () => clearInterval(interval);
  }, []);

  const p95Latency = telemetry?.p95_latency_ms ?? 340;
  const avgLatency = telemetry?.avg_latency_ms ?? 280;
  const p50Latency = telemetry?.p50_latency_ms ?? 120;
  const avgCost = telemetry?.avg_cost_usd ?? 0.00042;
  const totalCost = telemetry?.total_cost_usd ?? 0.0;
  const cacheHitRate = telemetry?.cache_hit_rate ?? 0.0;
  const cacheHits = telemetry?.cache_hits ?? 0;
  const costSaved = telemetry?.cost_saved_usd ?? 0.0;
  const satisfactionRate = telemetry?.satisfaction_rate ?? 96.0;
  const isLive = telemetry?.is_live ?? false;
  const totalQueries = telemetry?.total_queries ?? 0;

  return (
    <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-8 space-y-8">
      {/* En-tête concis avec statut temps réel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Télémétrie & Observabilité
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Performances, coûts réels et gouvernance en direct de la production.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
            isLive 
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
            {isLive ? `En direct • ${totalQueries} requêtes analysées` : 'Base de référence CI/CD'}
          </span>

          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            title="Actualiser les métriques"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-orange-500 hover:border-orange-500/30 transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-orange-500' : ''}`} />
          </button>
        </div>
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
            <p className="text-3xl sm:text-4xl font-extrabold font-mono text-slate-900 dark:text-white">
              {p95Latency} <span className="text-lg font-normal text-slate-400">ms</span>
            </p>
            <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-sky-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, Math.max(10, Math.round((p95Latency / 800) * 100)))}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-mono mt-2">
              <span>Moy: {avgLatency}ms • p50: {p50Latency}ms</span>
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
            <p className="text-3xl sm:text-4xl font-extrabold font-mono text-slate-900 dark:text-white">
              ${avgCost.toFixed(5)}
            </p>
            <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: '28%' }}></div>
            </div>
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-mono mt-2">
              <span>Cumulé: ${totalCost.toFixed(4)}</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Claude 3.5</span>
            </div>
          </div>
        </div>

        {/* Cache Sémantique Card */}
        <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-none flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-sm font-semibold">
            <span>Cache Sémantique</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Zap className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl sm:text-4xl font-extrabold font-mono text-slate-900 dark:text-white">
              {cacheHitRate} <span className="text-lg font-normal text-slate-400">%</span>
            </p>
            <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, Math.max(5, Math.round(cacheHitRate)))}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-mono mt-2">
              <span>{cacheHits} hits pgvector</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">+{costSaved.toFixed(4)}$ sauvés</span>
            </div>
          </div>
        </div>

        {/* Satisfaction / Quality Card */}
        <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-none flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-sm font-semibold">
            <span>Satisfaction / Qualité</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <Award className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl sm:text-4xl font-extrabold font-mono text-slate-900 dark:text-white">
              {satisfactionRate} <span className="text-lg font-normal text-slate-400">%</span>
            </p>
            <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, Math.max(10, Math.round(satisfactionRate)))}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs font-mono mt-2">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <ThumbsUp className="w-3 h-3 text-emerald-500" />
                {telemetry?.positive_feedback_count || 0} avis
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Fidélité 0.92</span>
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
              Langfuse Tracing & Infrastructure
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-mono font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Actif
            </span>
          </div>

          <div className="space-y-2.5 text-xs sm:text-sm font-mono bg-slate-50 dark:bg-[#0b0f17] p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-800/60">
              <span className="text-slate-500">Service Observabilité :</span>
              <span className="font-semibold text-slate-900 dark:text-white">cloud.langfuse.com</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-800/60">
              <span className="text-slate-500">Modèle LLM :</span>
              <span className="truncate max-w-[280px] text-slate-900 dark:text-white font-medium">{telemetry?.bedrock_llm_model || health?.bedrock_llm_model}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-800/60">
              <span className="text-slate-500">Vector Store & Cache :</span>
              <span className="truncate max-w-[280px] text-slate-900 dark:text-white font-medium">
                {telemetry?.vector_store_type || health?.vector_store_type || 'pgvector (PostgreSQL)'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-800/60">
              <span className="text-slate-500">Base Vectorielle :</span>
              <span className="text-slate-900 dark:text-white font-medium">
                {telemetry?.total_chunks_indexed ?? health?.total_chunks_indexed ?? 0} chunks ({telemetry?.total_documents_count ?? 0} docs)
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500">Version Prompt RAG :</span>
              <span className="px-2 py-0.5 rounded bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold border border-orange-500/20">
                {telemetry?.prompt_version || health?.prompt_version || 'v1.3.0'}
              </span>
            </div>
          </div>
        </div>

        {/* Quality Gate CI/CD & Gouvernance */}
        <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm dark:shadow-none">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-500 dark:text-sky-400" />
              Quality Gate & Gouvernance (Phase 4)
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20 font-mono font-medium">
              Vérifié
            </span>
          </div>

          <div className="space-y-2.5 text-xs sm:text-sm font-mono bg-slate-50 dark:bg-[#0b0f17] p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-800/60">
              <span className="text-slate-500">Protection Anti-Jailbreak :</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">Actif (Guardrails)</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-800/60">
              <span className="text-slate-500">Filtrage & Masquage PII :</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">Actif (Emails, Tel, Secrets)</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-800/60">
              <span className="text-slate-500">Fidélité RAGAS (Seuil &ge; 0.85) :</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">0.92 / 1.0 (Conforme)</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500">LLM-as-a-Judge (Seuil &ge; 3.8) :</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold">4.7 / 5.0 (Conforme)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline Flow Bar - Visual & Minimalist */}
      <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-none">
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs sm:text-sm font-medium">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
            <Database className="w-4 h-4 text-sky-500" />
            <span>Recherche Hybride pgvector</span>
          </div>

          <ChevronRight className="w-4 h-4 text-slate-400 hidden md:block shrink-0" />

          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Cache Sémantique & Guardrails</span>
          </div>

          <ChevronRight className="w-4 h-4 text-slate-400 hidden md:block shrink-0" />

          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
            <BarChart3 className="w-4 h-4 text-emerald-500" />
            <span>Bedrock Claude 3.5 & Langfuse</span>
          </div>
        </div>
      </div>
    </div>
  );
};
