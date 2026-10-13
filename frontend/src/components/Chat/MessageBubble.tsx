import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, User, Clock, DollarSign, Layers, Copy, Check, Zap, ShieldCheck, ShieldAlert } from 'lucide-react';
import { ChatMessage } from '../../types';
import { SourceCard } from './SourceCard';
import { FeedbackButtons } from './FeedbackButtons';

interface MessageBubbleProps {
  message: ChatMessage;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [highlightedSource, setHighlightedSource] = useState<number | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleCitationClick = (sourceNum: number) => {
    setHighlightedSource(sourceNum);
    const target = document.getElementById(`source-card-${sourceNum}`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleNamedSourceClick = (sourceName: string) => {
    if (!message.sources || message.sources.length === 0) return;
    const cleanTarget = sourceName.toLowerCase();
    const foundIdx = message.sources.findIndex((s) => {
      const sName = (s.metadata?.source || '').toLowerCase();
      return sName.includes(cleanTarget) || cleanTarget.includes(sName);
    });
    if (foundIdx !== -1) {
      handleCitationClick(foundIdx + 1);
    }
  };

  // Normalisation du Markdown (tableaux tronqués et citations)
  const formatMarkdownContent = (rawText: string): string => {
    if (isUser) return rawText;

    let text = rawText;

    // 1. Réparation des tableaux avec double pipe "||" collés sans saut de ligne
    text = text.replace(/\|\s*\|\s*(\-{3,})/g, '|\n| $1');
    text = text.replace(/\|\s*\|\s*([A-Za-z0-9\-\:\[])/g, '|\n| $1');

    // 2. Remplacement des citations textuelles [Source: document.pdf, Page 15]
    text = text.replace(/\[Source:\s*([^,\]]+)(?:,\s*(?:Page|p\.)\s*(\d+))?\]/gi, (_match, src, page) => {
      const cleanSrc = src.trim();
      const pageStr = page ? ` (p. ${page.trim()})` : '';
      return `[📄 ${cleanSrc}${pageStr}](#source-named-${encodeURIComponent(cleanSrc)})`;
    });

    // 3. Remplacement des citations numériques [1], [2]
    text = text.replace(/\[(\d+)\]/g, '[$1](#source-$1)');

    return text;
  };

  const processedContent = formatMarkdownContent(message.content);

  return (
    <div className={`flex gap-3.5 max-w-4xl w-full ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'} group`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-sm transition-transform duration-150 ${
        isUser
          ? 'bg-slate-900 dark:bg-slate-800 text-white border border-slate-800 dark:border-slate-700'
          : 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 dark:border-orange-500/30'
      }`}>
        {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
      </div>

      <div className={`space-y-2 overflow-hidden flex-1 ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`relative px-5 py-4 rounded-2xl text-base leading-relaxed transition-colors duration-200 ${
          isUser 
            ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100 rounded-tr-none shadow-sm ml-auto max-w-2xl border border-slate-800 dark:border-slate-700' 
            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none shadow-sm dark:shadow-none'
        }`}>
          <div className="prose prose-slate dark:prose-invert prose-base max-w-none break-words">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                table: ({ children }) => (
                  <div className="my-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/60">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs sm:text-sm">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-slate-100/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 font-bold uppercase tracking-wider text-[11px]">
                    {children}
                  </thead>
                ),
                tbody: ({ children }) => (
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {children}
                  </tbody>
                ),
                tr: ({ children }) => (
                  <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    {children}
                  </tr>
                ),
                th: ({ children }) => (
                  <th className="px-4 py-3 text-left font-bold whitespace-nowrap">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                    {children}
                  </td>
                ),
                h1: ({ children }) => (
                  <h1 className="text-lg font-bold text-slate-900 dark:text-white mt-4 mb-2 pb-1 border-b border-slate-200 dark:border-slate-800">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-base font-bold text-slate-900 dark:text-white mt-3.5 mb-1.5 flex items-center gap-1.5">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-3 mb-1">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="leading-relaxed mb-2.5 last:mb-0">
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="my-2.5 space-y-1 list-disc list-inside text-slate-800 dark:text-slate-200">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="my-2.5 space-y-1 list-decimal list-inside text-slate-800 dark:text-slate-200">
                    {children}
                  </ol>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-orange-500 bg-orange-500/5 dark:bg-orange-950/20 px-3.5 py-2 rounded-r-xl my-3 text-slate-700 dark:text-slate-300 italic text-sm">
                    {children}
                  </blockquote>
                ),
                code: ({ className, children }) => {
                  const isInline = !className;
                  if (isInline) {
                    return (
                      <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-orange-600 dark:text-orange-400 font-mono text-xs border border-slate-200 dark:border-slate-700">
                        {children}
                      </code>
                    );
                  }
                  return (
                    <div className="my-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-100 shadow-sm">
                      <pre>{children}</pre>
                    </div>
                  );
                },
                a: ({ href, children }) => {
                  if (href && href.startsWith('#source-named-')) {
                    const docName = decodeURIComponent(href.replace('#source-named-', ''));
                    return (
                      <button
                        type="button"
                        onClick={() => handleNamedSourceClick(docName)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 text-xs font-semibold rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-500/20 border border-orange-500/30 transition-all cursor-pointer align-baseline hover:scale-105"
                        title={`Voir l'extrait de ${docName}`}
                      >
                        {children}
                      </button>
                    );
                  }
                  if (href && href.startsWith('#source-')) {
                    const num = parseInt(href.replace('#source-', ''), 10);
                    return (
                      <button
                        type="button"
                        onClick={() => handleCitationClick(num)}
                        className="inline-flex items-center justify-center px-1.5 py-0.5 mx-0.5 text-xs font-bold rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-500/20 border border-orange-500/30 transition-all cursor-pointer align-baseline hover:scale-105"
                        title={`Afficher la source #${num}`}
                      >
                        [{num}]
                      </button>
                    );
                  }
                  return (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline">
                      {children}
                    </a>
                  );
                }
              }}
            >
              {processedContent}
            </ReactMarkdown>
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

        {isUser && message.timestamp && (
          <div className="text-[10px] text-slate-400 font-mono text-right pr-1">
            {message.timestamp}
          </div>
        )}

        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-orange-500 dark:text-orange-400" />
              Sources ({message.sources.length})
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {message.sources.map((s, idx) => (
                <SourceCard 
                  key={s.id || idx} 
                  source={s} 
                  index={idx + 1}
                  highlighted={highlightedSource === (idx + 1)}
                />
              ))}
            </div>
          </div>
        )}

        {!isUser && (
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-mono pt-1">
            {message.timestamp && (
              <span className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
                <Clock className="w-3 h-3" />
                {message.timestamp}
              </span>
            )}
            {message.metrics && (
              <>
                {message.metrics.cache_hit && (
                  <span 
                    className="flex items-center gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold px-2 py-0.5 rounded-md border border-amber-500/30"
                    title={`Réponse servie depuis le cache sémantique pgvector (0 ms LLM)`}
                  >
                    <Zap className="w-3 h-3 fill-amber-500/30" />
                    Cache Sémantique {message.metrics.cache_similarity ? `(${Math.round(message.metrics.cache_similarity * 100)}%)` : ''}
                  </span>
                )}
                {message.metrics.guardrail_blocked && (
                  <span className="flex items-center gap-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold px-2 py-0.5 rounded-md border border-rose-500/30">
                    <ShieldAlert className="w-3 h-3" />
                    Bloqué Guardrail
                  </span>
                )}
                {message.metrics.pii_redacted && (
                  <span 
                    className="flex items-center gap-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium px-2 py-0.5 rounded-md border border-blue-500/20"
                    title="Informations sensibles (emails, téléphones, tokens) anonymisées"
                  >
                    <ShieldCheck className="w-3 h-3" />
                    PII Masqué
                  </span>
                )}
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
