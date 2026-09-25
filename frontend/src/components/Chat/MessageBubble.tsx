import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, User, Clock, DollarSign, Layers, Copy, Check } from 'lucide-react';
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
    <div className={`flex gap-3.5 max-w-4xl w-full ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'} group`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-sm transition-transform duration-150 ${
        isUser
          ? 'bg-indigo-600 text-white'
          : 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 dark:border-orange-500/30'
      }`}>
        {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
      </div>

      <div className={`space-y-2 overflow-hidden flex-1 ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`relative px-5 py-4 rounded-2xl text-base leading-relaxed transition-colors duration-200 ${
          isUser 
            ? 'bg-indigo-600 text-white rounded-tr-none shadow-sm ml-auto max-w-2xl' 
            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none shadow-sm dark:shadow-none'
        }`}>
          <div className="prose prose-slate dark:prose-invert prose-base max-w-none break-words">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>

          {!isUser && message.content && (
            <button
              onClick={handleCopy}
              aria-label="Copier la réponse"
              title="Copier la réponse"
              className="absolute top-2.5 right-2.5 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 focus:opacity-100 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all duration-150 focus-visible:ring-2 focus-visible:ring-orange-500"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>

        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-orange-500 dark:text-orange-400" />
              Sources documentaires vérifiées ({message.sources.length}) :
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {message.sources.map((s, idx) => (
                <SourceCard key={s.id || idx} source={s} />
              ))}
            </div>
          </div>
        )}

        {!isUser && (
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-mono pt-1">
            {message.metrics && (
              <>
                <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700/80">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {message.metrics.total_latency_ms} ms
                </span>
                {message.metrics.cost_usd !== undefined && (
                  <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium px-2 py-0.5 rounded-md border border-emerald-500/20">
                    <DollarSign className="w-3 h-3" />
                    ${message.metrics.cost_usd.toFixed(5)}
                  </span>
                )}
                {message.metrics.prompt_version && (
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    {message.metrics.prompt_version}
                  </span>
                )}
              </>
            )}

            <FeedbackButtons traceId={message.traceId} initialScore={message.feedbackGiven} />
          </div>
        )}
      </div>
    </div>
  );
};
