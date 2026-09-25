import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import { ChatMessage } from '../../types';
import { MessageBubble } from './MessageBubble';
import { sendQueryStream } from '../../services/api';

interface ChatWindowProps {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages, setMessages }) => {
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || input).trim();
    if (!textToSend || isStreaming) return;

    setError(null);
    setInput('');

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
    };

    const assistantMessageId = `asst-${Date.now()}`;
    const initialAssistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      sources: [],
    };

    setMessages((prev) => [...prev, userMessage, initialAssistantMessage]);
    setIsStreaming(true);

    const historyPayload = messages.slice(-4).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    await sendQueryStream(
      textToSend,
      historyPayload,
      (meta) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  traceId: meta.trace_id,
                  sources: meta.sources,
                  metrics: {
                    total_latency_ms: meta.retrieval_ms,
                    retrieval_latency_ms: meta.retrieval_ms,
                  },
                }
              : msg
          )
        );
      },
      (token) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: msg.content + token }
              : msg
          )
        );
      },
      (doneMetrics) => {
        setIsStreaming(false);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  metrics: {
                    ...msg.metrics,
                    total_latency_ms: doneMetrics.total_latency_ms,
                    cost_usd: doneMetrics.cost_usd,
                    output_tokens: doneMetrics.tokens,
                  },
                }
              : msg
          )
        );
      },
      (err) => {
        setIsStreaming(false);
        setError("Erreur de connexion lors de la requête RAG.");
        console.error(err);
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestions = [
    "Qu'est-ce que l'observabilité LLMOps en production ?",
    "Comment fonctionne la recherche hybride avec RRF ?",
    "Quels sont les objectifs d'un LLM-as-a-Judge ?",
    "Quelle est la politique anti-hallucination du prompt ?"
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-50 dark:bg-[#0b0f17] transition-colors duration-200">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-6 lg:px-10 py-6 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-3xl mx-auto space-y-6 py-12">
            <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 dark:text-orange-400 shadow-md">
              <Sparkles className="w-8 h-8" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Assistant RAG Production-Ready
            </h2>
            <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
              Posez une question technique sur l'architecture LLMOps, les pipelines RAG, l'évaluation continue ou l'observabilité sur AWS.
            </p>
            <div className="flex flex-wrap gap-2.5 justify-center pt-2">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(s)}
                  className="px-4 py-2 rounded-xl text-sm bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-orange-500/50 hover:text-orange-600 dark:hover:text-white transition-all text-left shadow-sm"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto space-y-6">
            {messages.map((m) => <MessageBubble key={m.id} message={m} />)}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d131f] p-4 sm:p-5 transition-colors duration-200">
        <div className="max-w-5xl mx-auto space-y-2">
          {error && (
            <div className="flex items-center gap-2 text-xs text-rose-500 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="relative flex items-center bg-slate-50 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 rounded-2xl overflow-hidden focus-within:border-orange-500 shadow-sm dark:shadow-lg transition-colors">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Posez votre question (ex: Comment fonctionne le reranking ?)..."
              disabled={isStreaming}
              className="w-full bg-transparent px-5 py-4 text-base text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none resize-none font-sans"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isStreaming}
              className="mr-3 p-2.5 rounded-xl bg-orange-500 text-white disabled:opacity-30 disabled:hover:bg-orange-500 hover:bg-orange-600 transition-colors shadow-md shrink-0"
            >
              {isStreaming ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-2 font-mono">
            <span>Shift + Entrée pour retour à la ligne</span>
            <span>Tracing Langfuse actif • Streaming SSE</span>
          </div>
        </div>
      </div>
    </div>
  );
};
