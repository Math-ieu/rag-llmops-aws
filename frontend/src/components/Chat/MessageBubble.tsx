import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, User, Clock, DollarSign, Layers } from 'lucide-react';
import { ChatMessage } from '../../types';
import { SourceCard } from './SourceCard';
import { FeedbackButtons } from './FeedbackButtons';

interface MessageBubbleProps {
  message: ChatMessage;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
        isUser ? 'bg-indigo-600 text-white' : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
      }`}>
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      <div className={`space-y-2 overflow-hidden ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser 
            ? 'bg-indigo-600 text-white rounded-tr-none' 
            : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
        }`}>
          <div className="prose prose-invert prose-sm max-w-none break-words">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        </div>

        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-orange-400" />
              Sources documentaires citées ({message.sources.length}) :
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {message.sources.map((s, idx) => (
                <SourceCard key={s.id || idx} source={s} index={idx} />
              ))}
            </div>
          </div>
        )}

        {!isUser && (
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 font-mono pt-1">
            {message.metrics && (
              <>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {message.metrics.total_latency_ms} ms
                </span>
                {message.metrics.cost_usd !== undefined && (
                  <span className="flex items-center gap-1 text-emerald-400">
                    <DollarSign className="w-3 h-3" />
                    ${message.metrics.cost_usd.toFixed(5)}
                  </span>
                )}
                {message.metrics.prompt_version && (
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
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
