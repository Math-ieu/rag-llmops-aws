import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  RefreshCw, 
  AlertCircle, 
  MessageSquare, 
  Plus, 
  Trash2, 
  Clock, 
  PanelLeftClose, 
  PanelLeft 
} from 'lucide-react';
import { ChatMessage, ChatSession } from '../../types';
import { MessageBubble } from './MessageBubble';
import { 
  sendQueryStream, 
  fetchConversations, 
  fetchConversation, 
  saveConversationToBackend, 
  deleteConversationFromBackend 
} from '../../services/api';

const SESSIONS_STORAGE_KEY = 'rag_chat_sessions_v1';
const ACTIVE_SESSION_STORAGE_KEY = 'rag_active_session_id';
const SIDEBAR_STORAGE_KEY = 'rag_chat_sidebar_open';

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
  // Chargement des sessions depuis le localStorage
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

  // Sauvegarde automatique des sessions dans le localStorage
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

  // Synchronisation initiale avec l'historique de la base PostgreSQL
  useEffect(() => {
    let isMounted = true;
    const syncBackend = async () => {
      try {
        const remoteList = await fetchConversations();
        if (isMounted && Array.isArray(remoteList) && remoteList.length > 0) {
          setSessions((prev) => {
            const hasLocalHistory = prev.some((s) => s.messages.length > 0);
            if (!hasLocalHistory) {
              const formatted: ChatSession[] = remoteList.map((r: any) => ({
                id: r.id,
                title: r.title,
                createdAt: r.createdAt,
                updatedAt: r.updatedAt,
                messages: [],
              }));
              return formatted;
            }
            return prev;
          });
        }
      } catch (err) {
        console.warn('Backend conversations sync skipped', err);
      }
    };
    syncBackend();
    return () => { isMounted = false; };
  }, []);

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
    if (currentMessages.length === 0) return; // Déjà une session vierge
    const newSession = createEmptySession();
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setError(null);
  };

  const handleSelectSession = async (id: string) => {
    if (isStreaming || id === activeSessionId) return;
    setActiveSessionId(id);
    setError(null);

    const targetSession = sessions.find((s) => s.id === id);
    if (targetSession && targetSession.messages.length === 0) {
      try {
        const fullConv = await fetchConversation(id);
        if (fullConv && Array.isArray(fullConv.messages) && fullConv.messages.length > 0) {
          setSessions((prev) =>
            prev.map((s) => (s.id === id ? { ...s, messages: fullConv.messages } : s))
          );
        }
      } catch (err) {
        console.warn('Failed to load conversation details', err);
      }
    }
  };

  const handleDeleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (isStreaming) return;
    deleteConversationFromBackend(id);
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

    // Calcul du titre de discussion automatique au 1er message
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
                        total_latency_ms: meta.retrieval_ms || 0,
                        retrieval_latency_ms: meta.retrieval_ms || 0,
                        cache_hit: meta.cache_hit,
                        cache_similarity: meta.cache_similarity,
                        guardrail_blocked: meta.guardrail_blocked,
                        pii_redacted: meta.pii_redacted,
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
        setSessions((prev) => {
          const updated = prev.map((s) => {
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
                        cache_hit: doneMetrics.cache_hit !== undefined ? doneMetrics.cache_hit : msg.metrics?.cache_hit,
                        cache_similarity: doneMetrics.cache_similarity !== undefined ? doneMetrics.cache_similarity : msg.metrics?.cache_similarity,
                        guardrail_blocked: doneMetrics.guardrail_blocked !== undefined ? doneMetrics.guardrail_blocked : msg.metrics?.guardrail_blocked,
                      },
                    }
                  : msg
              ),
            };
          });

          // Enregistrement asynchrone sur PostgreSQL
          const currentTarget = updated.find((s) => s.id === currentSession.id);
          if (currentTarget && currentTarget.messages.length > 0) {
            saveConversationToBackend(currentTarget.id, currentTarget.title, currentTarget.messages);
          }

          return updated;
        });
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
    <div className="flex h-[calc(100vh-4rem)] bg-slate-50 dark:bg-[#0b0f17] transition-colors duration-200 overflow-hidden">
      {/* Sidebar Historique des Discussions */}
      <aside
        className={`${
          sidebarOpen ? 'w-72 sm:w-80' : 'w-0'
        } transition-all duration-300 ease-in-out border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d131f] flex flex-col shrink-0 overflow-hidden relative`}
      >
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
          <button
            onClick={handleNewSession}
            disabled={isStreaming}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle discussion</span>
          </button>
          <button
            onClick={() => setSidebarOpen(false)}
            title="Masquer l'historique"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* Titre et compteur */}
        <div className="px-4 pt-3 pb-2 flex items-center justify-between text-[11px] font-mono text-slate-400 uppercase tracking-wider">
          <span>Historique</span>
          <span className="px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px]">
            {sessions.length}
          </span>
        </div>

        {/* Liste des discussions */}
        <div className="flex-1 overflow-y-auto px-2.5 py-1 space-y-1">
          {sessions.map((session) => {
            const isActive = session.id === currentSession.id;
            return (
              <div
                key={session.id}
                onClick={() => handleSelectSession(session.id)}
                className={`group relative flex items-start gap-2.5 p-2.5 rounded-xl cursor-pointer text-xs transition-all ${
                  isActive
                    ? 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border border-orange-500/30 font-medium'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <MessageSquare className={`w-4 h-4 shrink-0 mt-0.5 ${isActive ? 'text-orange-500' : 'text-slate-400'}`} />
                <div className="flex-1 min-w-0 pr-6">
                  <p className="truncate font-semibold text-slate-900 dark:text-white">
                    {session.title}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    <span>{formatSessionDate(session.createdAt)}</span>
                  </p>
                </div>

                {/* Bouton de suppression */}
                <button
                  onClick={(e) => handleDeleteSession(e, session.id)}
                  title="Supprimer la discussion"
                  className="absolute right-2 top-2.5 p-1 rounded-md opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Bas de sidebar */}
        {sessions.length > 1 && (
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 text-center">
            <button
              onClick={handleClearAll}
              className="text-[11px] text-slate-400 hover:text-rose-500 font-mono transition-colors"
            >
              Effacer tout l’historique
            </button>
          </div>
        )}
      </aside>

      {/* Zone Principale de Chat */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        {/* Barre d'en-tête du Chat */}
        <div className="px-6 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-[#0b0f17]/80 backdrop-blur-md flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-3 truncate">
            {!sidebarOpen ? (
              <>
                <button
                  onClick={() => setSidebarOpen(true)}
                  title="Afficher l'historique"
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-orange-500 hover:border-orange-500/40 transition-colors flex items-center gap-1.5"
                >
                  <PanelLeft className="w-4 h-4" />
                  <span className="hidden sm:inline font-sans text-xs">Historique</span>
                </button>
                <span className="text-slate-400 dark:text-slate-500 hidden sm:inline">&bull;</span>
              </>
            ) : (
              <MessageSquare className="w-3.5 h-3.5 text-orange-500 shrink-0 hidden sm:inline" />
            )}
            <span className="truncate text-slate-700 dark:text-slate-300 font-sans font-medium">
              {currentSession.title}
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0 text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{formatSessionDate(currentSession.createdAt)}</span>
            </span>
            <button
              onClick={handleNewSession}
              disabled={isStreaming}
              title="Nouvelle discussion"
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-orange-500 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto px-6 lg:px-10 py-6 space-y-6">
          {currentMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-5 py-12">
              <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 dark:text-orange-400 shadow-sm">
                <Sparkles className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Assistant RAG
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Posez votre question.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center pt-1">
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(s)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-orange-500/50 hover:text-orange-600 dark:hover:text-white transition-all text-left shadow-sm"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-6">
              {currentMessages.map((m) => (
                <MessageBubble key={m.id} message={m} />
              ))}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Box */}
        <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d131f] p-4 sm:p-5 transition-colors duration-200">
          <div className="max-w-4xl mx-auto space-y-2">
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
                placeholder="Posez votre question..."
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
            <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 px-2 font-mono">
              <span>Entrée pour envoyer</span>
              <span>Streaming SSE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
