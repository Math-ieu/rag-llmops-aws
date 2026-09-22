import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Check } from 'lucide-react';
import { submitFeedback } from '../../services/api';

interface FeedbackButtonsProps {
  traceId?: string;
  initialScore?: number;
}

export const FeedbackButtons: React.FC<FeedbackButtonsProps> = ({ traceId, initialScore }) => {
  const [selected, setSelected] = useState<number | null>(initialScore ?? null);
  const [loading, setLoading] = useState(false);

  if (!traceId) return null;

  const handleVote = async (score: number) => {
    if (selected === score || loading) return;
    setLoading(true);
    try {
      await submitFeedback(traceId, score);
      setSelected(score);
    } catch (e) {
      console.error('Failed to submit feedback', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5 mt-2">
      <button
        onClick={() => handleVote(1.0)}
        disabled={loading}
        title="Réponse utile et exacte (+1 Langfuse)"
        className={`p-1 rounded text-xs transition-colors ${
          selected === 1.0
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
        }`}
      >
        <ThumbsUp className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={() => handleVote(-1.0)}
        disabled={loading}
        title="Réponse imprécise ou inexacte (-1 Langfuse)"
        className={`p-1 rounded text-xs transition-colors ${
          selected === -1.0
            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
        }`}
      >
        <ThumbsDown className="w-3.5 h-3.5" />
      </button>

      {selected !== null && (
        <span className="text-[10px] text-slate-500 flex items-center gap-1 ml-1 font-mono">
          <Check className="w-3 h-3 text-emerald-400" />
          Feedback synchronisé avec Langfuse
        </span>
      )}
    </div>
  );
};
