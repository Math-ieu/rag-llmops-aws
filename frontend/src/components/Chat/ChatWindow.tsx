import React, { useState, useRef, useEffect } from 'react';
import { 
  RefreshCw, 
  AlertCircle, 
  Plus, 
  Trash2, 
  PanelLeftClose, 
  PanelLeft 
} from 'lucide-react';
import { ChatMessage, ChatSession } from '../../types';
import { MessageBubble } from './MessageBubble';
import { sendQueryStream } from '../../services/api';

const SESSIONS_STORAGE_KEY = 'rag_chat_sessions_v1';
const ACTIVE_SESSION_STORAGE_KEY = 'rag_active_session_id';
const SIDEBAR_STORAGE_KEY = 'rag_chat_sidebar_open';

const BADGE_COLORS = [
  'bg-blue-600 text-white',
  'bg-orange-600 text-white',
  'bg-purple-600 text-white',
  'bg-amber-600 text-white',
  'bg-teal-600 text-white',
  'bg-rose-600 text-white',
  'bg-emerald-600 text-white',
  'bg-indigo-600 text-white',
];

const formatSessionDate = (isoStr: string): string => {
  try {
    const d = new Date(isoStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();

    const timeStr = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    if (isToday) return `Aujourd'hui, ${timeStr}`;
    if (isYesterday) return `Hier, ${timeStr}`;
    return `${d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}, ${timeStr}`;
  } catch {
    return isoStr;
  }
};

const createEmptySession = (): ChatSession => ({
  id: `session-${Date.now()}`,
  title: 'Nouvelle discussion',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  messages: []
});

interface ChatWindowProps {
  messages?: ChatMessage[];
  setMessages?: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export const ChatWindow: React.FC<ChatWindowProps> = () => {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Erreur chargement sessions', e);
    }
    return [createEmptySession()];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);
      if (saved) return saved;
    } catch (e) {}
    return sessions[0]?.id || '';
  });

  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (saved !== null) return saved === 'true';
    } catch (e) {}
    return true;
  });

  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
    } catch (e) {}
  }, [sessions]);

  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, activeSessionId);
    } catch (e) {}
  }, [activeSessionId]);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(sidebarOpen));
    } catch (e) {}
  }, [sidebarOpen]);

  const currentSession = sessions.find((s) => s.id === activeSessionId) || sessions[0] || createEmptySession();
  const currentMessages = currentSession.messages;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages, isStreaming]);

  const handleNewSession = () => {
    if (isStreaming) return;
    if (currentMessages.length === 0) return;
    const newSession = createEmptySession();
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setError(null);
  };

  const handleSelectSession = (id: string) => {
    if (isStreaming || id === activeSessionId) return;
    setActiveSessionId(id);
    setError(null);
  };

  const handleDeleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (isStreaming) return;
    const remaining = sessions.filter((s) => s.id !== id);
    if (remaining.length === 0) {
      const newSession = createEmptySession();
      setSessions([newSession]);
      setActiveSessionId(newSession.id);
    } else {
      setSessions(remaining);
      if (id === activeSessionId) {
        setActiveSessionId(remaining[0].id);
      }
    }
  };

  const handleClearAll = () => {
    if (isStreaming) return;
    if (!confirm('Effacer tout l’historique des discussions ?')) return;
    const newSession = createEmptySession();
    setSessions([newSession]);
    setActiveSessionId(newSession.id);
  };

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || input).trim();
    if (!textToSend || isStreaming) return;

    setError(null);
    setInput('');

    const now = new Date();
    const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: timeStr,
    };

    const assistantMessageId = `asst-${Date.now()}`;
    const initialAssistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: timeStr,
      sources: [],
    };

    const isFirstMsg = currentMessages.length === 0;
    const sessionTitle = isFirstMsg 
      ? (textToSend.length > 36 ? textToSend.slice(0, 36) + '…' : textToSend)
      : currentSession.title;

    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== currentSession.id) return s;
        return {
          ...s,
          title: sessionTitle,
          updatedAt: now.toISOString(),
          messages: [...s.messages, userMessage, initialAssistantMessage],
        };
      })
    );

    setIsStreaming(true);

    const historyPayload = currentMessages.slice(-4).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    await sendQueryStream(
      textToSend,
      historyPayload,
      (meta) => {
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id !== currentSession.id) return s;
            return {
              ...s,
              messages: s.messages.map((msg) =>
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
              ),
            };
          })
        );
      },
      (token) => {
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id !== currentSession.id) return s;
            return {
              ...s,
              messages: s.messages.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, content: msg.content + token }
                  : msg
              ),
            };
          })
        );
      },
      (doneMetrics) => {
        setIsStreaming(false);
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id !== currentSession.id) return s;
            return {
              ...s,
              updatedAt: new Date().toISOString(),
              messages: s.messages.map((msg) =>
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
              ),
            };
          })
        );
      },
      (err) => {
        setIsStreaming(false);
        setError("Erreur de connexion lors de la requête RAG.");
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id !== currentSession.id) return s;
            return {
              ...s,
              messages: s.messages.filter(
                (msg) => msg.id !== assistantMessageId || msg.content.trim().length > 0
              ),
            };
          })
        );
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
    "Observabilité LLMOps",
    "Recherche hybride RRF",
    "Évaluation LLM-as-a-Judge",
    "Garde-fous anti-hallucination"
  ];

  return (
    <div className="flex h-[calc(100vh-5.75rem)] bg-[#f6f6f4] dark:bg-[#0e1015] transition-colors overflow-hidden">
      {/* 1. Sidebar Historique Numéroté */}
      <aside
        className={`${
          sidebarOpen ? 'w-72 sm:w-80' : 'w-0'
        } transition-all duration-200 border-r border-neutral-300 dark:border-neutral-800 bg-white dark:bg-[#0c0f17] flex flex-col shrink-0 overflow-hidden relative`}
      >
        {/* En-tête Sidebar : Bouton Action Brutaliste */}
        <div className="p-3 border-b border-neutral-300 dark:border-neutral-800 flex items-center justify-between gap-2">
          <button
            onClick={handleNewSession}
            disabled={isStreaming}
            className="flex-1 py-1.5 px-3 bg-black hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-black font-mono font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nouvelle discussion</span>
          </button>
          <button
            onClick={() => setSidebarOpen(false)}
            title="Masquer l'historique"
            className="p-1.5 border border-neutral-300 dark:border-neutral-700 text-neutral-500 hover:text-black dark:hover:text-white"
          >
            <PanelLeftClose className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Section Header */}
        <div className="px-3.5 py-2 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-neutral-400 border-b border-neutral-200 dark:border-neutral-800/60">
          <span>01 / HISTORIQUE</span>
          <span>{sessions.length} SESSIONS</span>
        </div>

        {/* Liste des Discussions Numérotées */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {sessions.map((session, idx) => {
            const isActive = session.id === currentSession.id;
            const badgeColor = BADGE_COLORS[idx % BADGE_COLORS.length];
            const formattedIndex = String(idx + 1).padStart(2, '0');

            return (
              <div
                key={session.id}
                onClick={() => handleSelectSession(session.id)}
                className={`group relative p-2.5 border cursor-pointer transition-colors ${
                  isActive
                    ? 'border-black dark:border-white bg-neutral-100 dark:bg-neutral-900'
                    : 'border-neutral-200 dark:border-neutral-800/80 hover:border-neutral-400 dark:hover:border-neutral-600 bg-white dark:bg-[#0c0f17]'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <span className={`font-mono text-[9px] font-black px-1 py-0.5 shrink-0 ${badgeColor}`}>
                    {formattedIndex}
                  </span>
                  <div className="flex-1 min-w-0 pr-5">
                    <p className="font-bold text-xs text-neutral-900 dark:text-white truncate">
                      {session.title}
                    </p>
                    <p className="text-[10px] text-neutral-400 font-mono mt-0.5 uppercase">
                      {formatSessionDate(session.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Bouton de Suppression */}
                <button
                  onClick={(e) => handleDeleteSession(e, session.id)}
                  title="Supprimer la discussion"
                  className="absolute right-2 top-2 p-1 text-neutral-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Bas de Sidebar */}
        {sessions.length > 1 && (
          <div className="p-2.5 border-t border-neutral-300 dark:border-neutral-800 text-center">
            <button
              onClick={handleClearAll}
              className="text-[10px] font-mono uppercase text-neutral-400 hover:text-rose-600 transition-colors"
            >
              Effacer tout l’historique
            </button>
          </div>
        )}
      </aside>

      {/* 2. Zone Principale de Chat */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-[#f6f6f4] dark:bg-[#0e1015]">
        {/* Barre Supérieure du Chat */}
        <div className="h-9 px-4 sm:px-6 border-b border-neutral-300 dark:border-neutral-800 bg-white dark:bg-[#0c0f17] flex items-center justify-between text-[11px] font-mono uppercase tracking-wider select-none shrink-0">
          <div className="flex items-center gap-2 truncate">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                title="Afficher l'historique"
                className="p-1 border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white flex items-center gap-1"
              >
                <PanelLeft className="w-3 h-3" />
                <span className="text-[10px] hidden sm:inline">HISTORIQUE</span>
              </button>
            )}
            <span className="font-bold text-neutral-900 dark:text-white truncate">
              01 / {currentSession.title}
            </span>
          </div>

          <div className="flex items-center gap-3 text-neutral-400 text-[10px]">
            <span>{formatSessionDate(currentSession.createdAt)}</span>
            <span className="hidden md:inline">•</span>
            <span className="hidden md:inline text-neutral-700 dark:text-neutral-300">CLAUDE 3.5 // 1024D</span>
          </div>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6">
          {currentMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto space-y-4 py-12">
              <div className="w-10 h-10 border border-black dark:border-white bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-mono font-black text-sm">
                RAG
              </div>
              <div className="space-y-1">
                <h2 className="text-base font-bold text-neutral-900 dark:text-white uppercase font-mono tracking-wider">
                  Recherche RAG & Synthèse
                </h2>
                <p className="text-xs text-neutral-500 font-mono">
                  Posez une question sur les documents indexés.
                </p>
              </div>

              {/* Suggestions en cartes techniques */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 w-full">
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(s)}
                    className="p-2.5 border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-[#0c0f17] text-left text-xs font-mono uppercase text-neutral-800 dark:text-neutral-200 hover:border-black dark:hover:border-white transition-colors"
                  >
                    <span className="text-[10px] text-neutral-400 block">0{idx + 1} / QUESTION</span>
                    <span className="font-bold truncate block">{s}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {currentMessages.map((m) => (
                <MessageBubble key={m.id} message={m} />
              ))}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Box Brutaliste */}
        <div className="border-t border-neutral-300 dark:border-neutral-800 bg-white dark:bg-[#0c0f17] p-3 sm:p-4 shrink-0">
          <div className="max-w-4xl mx-auto space-y-2">
            {error && (
              <div className="flex items-center gap-2 text-xs font-mono text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 p-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="uppercase">{error}</span>
              </div>
            )}

            <div className="border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 flex items-center focus-within:border-black dark:focus-within:border-white transition-colors">
              <span className="pl-3.5 pr-1 font-mono text-xs text-neutral-400 font-bold select-none">&gt;</span>
              <textarea
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="SAISISSEZ VOTRE QUESTION..."
                disabled={isStreaming}
                className="w-full bg-transparent px-2.5 py-3 text-xs sm:text-sm font-mono text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none resize-none uppercase"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isStreaming}
                className="m-1.5 px-4 py-2 bg-black hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-black font-mono font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-30 shrink-0 flex items-center gap-1.5"
              >
                {isStreaming ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <span>ENVOYER</span>
                    <span className="text-[10px] opacity-70 hidden sm:inline">[↵]</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
