import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Layers, Copy, Check } from 'lucide-react';
import { ChatMessage } from '../../types';
import { SourceCard } from './SourceCard';
import { FeedbackButtons } from './FeedbackButtons';

interface MessageBubbleProps {
  message: ChatMessage;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <div className={`w-full max-w-4xl mx-auto space-y-1.5 ${isUser ? 'ml-auto' : 'mr-auto'}`}>
      {/* En-tête Technique Horodaté */}
      <div className={`flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider ${isUser ? 'justify-end text-neutral-400' : 'justify-start text-neutral-500'}`}>
        {isUser ? (
          <>
            <span>UTILISATEUR</span>
            <span>//</span>
            <span>{message.timestamp || 'MAINTENANT'}</span>
          </>
        ) : (
          <>
            <span className="font-bold text-neutral-800 dark:text-neutral-200">SYNTHÈSE RAG // CLAUDE 3.5</span>
            <span>//</span>
            <span>{message.timestamp || 'MAINTENANT'}</span>
          </>
        )}
      </div>

      {/* Carte du Message */}
      <div
        className={`border p-4 relative text-sm leading-relaxed transition-colors group ${
          isUser
            ? 'border-neutral-900 bg-neutral-900 text-white dark:border-neutral-200 dark:bg-neutral-100 dark:text-black ml-auto max-w-2xl'
            : 'border-neutral-300 dark:border-neutral-800 bg-white dark:bg-[#0c0f17] text-neutral-900 dark:text-neutral-100'
        }`}
      >
        <div className={`prose ${isUser ? 'prose-invert dark:prose' : 'prose-neutral dark:prose-invert'} max-w-none break-words text-sm`}>
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>

        {/* Bouton Copier */}
        {!isUser && message.content && (
          <button
            onClick={handleCopy}
            title="Copier la réponse"
            className="absolute top-3 right-3 p-1 border border-neutral-200 dark:border-neutral-800 opacity-0 group-hover:opacity-100 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:border-black dark:hover:border-white transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Sources Citées */}
      {!isUser && message.sources && message.sources.length > 0 && (
        <div className="pt-2 space-y-1.5">
          <div className="text-[10px] font-mono uppercase font-bold text-neutral-400 flex items-center gap-1.5">
            <Layers className="w-3 h-3" />
            <span>SOURCES DOCUMENTAIRES ({message.sources.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {message.sources.map((s, idx) => (
              <SourceCard key={s.id || idx} source={s} />
            ))}
          </div>
        </div>
      )}

      {/* Télémétrie en Ligne de Commande */}
      {!isUser && (
        <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-[10px]">
          {message.metrics && (
            <>
              <span className="px-1.5 py-0.5 border border-neutral-300 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300">
                LATENCE: {message.metrics.total_latency_ms}MS
              </span>
              {message.metrics.cost_usd !== undefined && (
                <span className="px-1.5 py-0.5 border border-neutral-300 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300">
                  COÛT: ${message.metrics.cost_usd.toFixed(5)}
                </span>
              )}
              {message.metrics.output_tokens && (
                <span className="px-1.5 py-0.5 border border-neutral-300 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300">
                  TOKENS: {message.metrics.output_tokens}
                </span>
              )}
            </>
          )}

          <div className="ml-auto">
            <FeedbackButtons traceId={message.traceId} initialScore={message.feedbackGiven} />
          </div>
        </div>
      )}
    </div>
  );
};
