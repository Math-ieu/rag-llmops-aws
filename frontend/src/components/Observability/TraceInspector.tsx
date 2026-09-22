import React from 'react';
import { Activity, ShieldCheck, DollarSign, Clock, Layers, Award, AlertTriangle, ExternalLink } from 'lucide-react';
import { SystemHealth } from '../../types';

interface TraceInspectorProps {
  health: SystemHealth | null;
}

export const TraceInspector: React.FC<TraceInspectorProps> = ({ health }) => {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Observabilité, Télémétrie & Évaluation Continue</h2>
        <p className="text-sm text-slate-400 mt-1">
          Supervision en temps réel des performances LLMOps : traçabilité distribuée (Langfuse),
          suivi des coûts et Quality Gate anti-régression (Ragas + LLM-as-a-Judge).
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Latence p95</span>
            <Clock className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-white mt-2">340 ms</p>
          <span className="text-[10px] text-emerald-400 font-mono">Conforme SLA &lt; 800ms</span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Coût moyen / requête</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-white mt-2">$0.00042</p>
          <span className="text-[10px] text-slate-400 font-mono">Claude 3.5 Sonnet Bedrock</span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Score Fidélité (Faithfulness)</span>
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-white mt-2">0.92 / 1.0</p>
          <span className="text-[10px] text-emerald-400 font-mono">Seuil Quality Gate &gt; 0.85</span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Score LLM-as-a-Judge</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-white mt-2">4.7 / 5.0</p>
          <span className="text-[10px] text-emerald-400 font-mono">Juge automatisé Bedrock</span>
        </div>
      </div>

      {/* Observability Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-orange-400" />
              Télémétrie Distribuée (Langfuse)
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
              Opérationnel
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Chaque requête génère un arbre de traces avec des spans distincts pour la recherche hybride,
            le reranking, le temps jusqu'au premier token (TTFT) et le retour utilisateur.
          </p>
          <div className="space-y-2 text-xs font-mono bg-[#0b0f17] p-3 rounded-lg border border-slate-800 text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-500">Service Host :</span>
              <span>cloud.langfuse.com</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Modèle actif :</span>
              <span className="truncate max-w-[220px]">{health?.bedrock_llm_model}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Prompt Version :</span>
              <span className="text-amber-400">{health?.prompt_version}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-400" />
              CI/CD Quality Gate (Anti-Régression)
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono">
              GitHub Actions
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Avant chaque déploiement sur AWS, le pipeline exécute le golden dataset pour tester
            le non-décrochage de la fidélité et bloquer tout prompt induisant des hallucinations.
          </p>
          <div className="space-y-2 text-xs font-mono bg-[#0b0f17] p-3 rounded-lg border border-slate-800 text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-500">Golden Dataset :</span>
              <span>5 cas de test de référence</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Seuil de fidélité :</span>
              <span>&gt;= 0.85 (Actuel: 0.92)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Action sur échec :</span>
              <span className="text-rose-400 font-bold">Merge Bloqué (Exit 1)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
