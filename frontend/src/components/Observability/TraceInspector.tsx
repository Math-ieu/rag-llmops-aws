import React from 'react';
import { ShieldCheck, Activity } from 'lucide-react';
import { SystemHealth } from '../../types';

interface TraceInspectorProps {
  health: SystemHealth | null;
}

export const TraceInspector: React.FC<TraceInspectorProps> = ({ health }) => {
  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 py-6 space-y-6">
      {/* 1. Section Header 01 */}
      <div className="flex items-center justify-between border-b border-neutral-300 dark:border-neutral-800 pb-2 text-[11px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
        <span className="font-bold text-neutral-900 dark:text-white">01 / TÉLÉMÉTRIE & PERFORMANCES EN TEMPS RÉEL</span>
        <span>4 MÉTRIQUES CLÉS</span>
      </div>

      {/* 2. KPI Cards Grid - Numérotées comme la maquette */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 font-mono">
        {/* Latence */}
        <div className="border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-[#0c0f17] p-4 flex flex-col justify-between hover:border-black dark:hover:border-neutral-600 transition-colors">
          <div className="flex items-center justify-between pb-3">
            <span className="font-mono text-[10px] font-black px-1.5 py-0.5 bg-blue-600 text-white">01</span>
            <span className="text-[10px] text-neutral-400 uppercase">SLA &lt; 800MS</span>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] text-neutral-500 uppercase">LATENCE P95</p>
            <p className="text-3xl font-black text-neutral-900 dark:text-white">340 ms</p>
            <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-1">
              <div className="bg-blue-600 h-full" style={{ width: '42%' }}></div>
            </div>
            <div className="flex justify-between text-[10px] text-neutral-400">
              <span>p50: 120ms</span>
              <span className="font-bold text-neutral-700 dark:text-neutral-300">Conforme</span>
            </div>
          </div>
        </div>

        {/* Coût */}
        <div className="border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-[#0c0f17] p-4 flex flex-col justify-between hover:border-black dark:hover:border-neutral-600 transition-colors">
          <div className="flex items-center justify-between pb-3">
            <span className="font-mono text-[10px] font-black px-1.5 py-0.5 bg-orange-600 text-white">02</span>
            <span className="text-[10px] text-neutral-400 uppercase">BUDGET OPTIMISÉ</span>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] text-neutral-500 uppercase">COÛT ESTIMÉ / REQ</p>
            <p className="text-3xl font-black text-neutral-900 dark:text-white">$0.00042</p>
            <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-1">
              <div className="bg-orange-600 h-full" style={{ width: '28%' }}></div>
            </div>
            <div className="flex justify-between text-[10px] text-neutral-400">
              <span>Claude 3.5</span>
              <span className="font-bold text-neutral-700 dark:text-neutral-300">Titan Text v2</span>
            </div>
          </div>
        </div>

        {/* Fidélité */}
        <div className="border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-[#0c0f17] p-4 flex flex-col justify-between hover:border-black dark:hover:border-neutral-600 transition-colors">
          <div className="flex items-center justify-between pb-3">
            <span className="font-mono text-[10px] font-black px-1.5 py-0.5 bg-purple-600 text-white">03</span>
            <span className="text-[10px] text-neutral-400 uppercase">RAGAS METRIC</span>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] text-neutral-500 uppercase">FIDÉLITÉ (FAITHFULNESS)</p>
            <p className="text-3xl font-black text-neutral-900 dark:text-white">
              0.92 <span className="text-sm font-normal text-neutral-400">/ 1.0</span>
            </p>
            <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-1">
              <div className="bg-purple-600 h-full" style={{ width: '92%' }}></div>
            </div>
            <div className="flex justify-between text-[10px] text-neutral-400">
              <span>Seuil min: 0.85</span>
              <span className="font-bold text-neutral-700 dark:text-neutral-300">Anti-hallucination</span>
            </div>
          </div>
        </div>

        {/* LLM Judge */}
        <div className="border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-[#0c0f17] p-4 flex flex-col justify-between hover:border-black dark:hover:border-neutral-600 transition-colors">
          <div className="flex items-center justify-between pb-3">
            <span className="font-mono text-[10px] font-black px-1.5 py-0.5 bg-amber-600 text-white">04</span>
            <span className="text-[10px] text-neutral-400 uppercase">SCORE EXPERT</span>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] text-neutral-500 uppercase">LLM-AS-A-JUDGE</p>
            <p className="text-3xl font-black text-neutral-900 dark:text-white">
              4.7 <span className="text-sm font-normal text-neutral-400">/ 5.0</span>
            </p>
            <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-1">
              <div className="bg-amber-600 h-full" style={{ width: '94%' }}></div>
            </div>
            <div className="flex justify-between text-[10px] text-neutral-400">
              <span>Évaluation sémantique</span>
              <span className="font-bold text-neutral-700 dark:text-neutral-300">Conforme</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Section Header 02 & Blocs Détaillés */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between border-b border-neutral-300 dark:border-neutral-800 pb-2 text-[11px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          <span className="font-bold text-neutral-900 dark:text-white">02 / CONFIGURATION & OBSERVABILITÉ DISTRIBUÉE</span>
          <span>2 MODULES</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 font-mono text-xs">
          {/* Langfuse Tracing */}
          <div className="border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-[#0c0f17] p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
              <span className="font-bold text-neutral-900 dark:text-white uppercase flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-neutral-900 dark:text-white" />
                Langfuse Tracing
              </span>
              <span className="text-[10px] px-1.5 py-0.5 border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 font-bold uppercase">
                ACTIF
              </span>
            </div>

            <div className="space-y-2 text-[11px]">
              <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800/60">
                <span className="text-neutral-400">ENDPOINT OBSERVABILITÉ</span>
                <span className="font-bold text-neutral-900 dark:text-white">cloud.langfuse.com</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800/60">
                <span className="text-neutral-400">MODÈLE GÉNÉRATION</span>
                <span className="font-bold text-neutral-900 dark:text-white truncate max-w-[280px]">
                  {health?.bedrock_llm_model || 'anthropic.claude-3-5-sonnet'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800/60">
                <span className="text-neutral-400">MODÈLE VECTORIEL</span>
                <span className="font-bold text-neutral-900 dark:text-white truncate max-w-[280px]">
                  {health?.bedrock_embedding_model || 'amazon.titan-embed-text-v2'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-neutral-400">VERSION DU PROMPT</span>
                <span className="font-bold text-neutral-900 dark:text-white">
                  {health?.prompt_version || 'v1.2.0'}
                </span>
              </div>
            </div>
          </div>

          {/* Quality Gate CI/CD */}
          <div className="border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-[#0c0f17] p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
              <span className="font-bold text-neutral-900 dark:text-white uppercase flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-neutral-900 dark:text-white" />
                Quality Gate CI/CD
              </span>
              <span className="text-[10px] px-1.5 py-0.5 bg-black text-white dark:bg-white dark:text-black font-bold uppercase">
                TESTS VALIDÉS (10/10)
              </span>
            </div>

            <div className="space-y-2 text-[11px]">
              <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800/60">
                <span className="text-neutral-400">DATASET DE RÉFÉRENCE</span>
                <span className="font-bold text-neutral-900 dark:text-white">golden_dataset.json</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800/60">
                <span className="text-neutral-400">RÉSOLUTION DES HALLUCINATIONS</span>
                <span className="font-bold text-neutral-900 dark:text-white">100% Détectées & Bloquées</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800/60">
                <span className="text-neutral-400">RÉPONSES SÉMANTIQUES (ROUGE-L)</span>
                <span className="font-bold text-neutral-900 dark:text-white">Score 0.88 / 1.0</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-neutral-400">PROTECTION DÉPLOIEMENT</span>
                <span className="font-bold text-neutral-900 dark:text-white">Pipeline Bloquant si Score &lt; 0.80</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
