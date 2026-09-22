import { SystemHealth } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function fetchSystemHealth(): Promise<SystemHealth> {
  const res = await fetch(`${API_BASE}/api/system/health`);
  if (!res.ok) throw new Error('Impossible de contacter le backend');
  return res.json();
}

export async function submitFeedback(traceId: string, score: number, comment?: string): Promise<void> {
  await fetch(`${API_BASE}/api/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trace_id: traceId, score, comment })
  });
}

export async function uploadDocumentFile(file: File): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/api/ingest/file`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Erreur lors de l’indexation du fichier');
  }
  return res.json();
}

export async function sendQueryStream(
  query: string,
  chatHistory: { role: string; content: string }[],
  onMetadata: (metadata: { trace_id: string; sources: any[]; retrieval_ms: number }) => void,
  onToken: (token: string) => void,
  onDone: (metrics: { total_latency_ms: number; cost_usd: number; tokens: number }) => void,
  onError: (err: any) => void
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/api/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        chat_history: chatHistory,
        user_id: 'web_client'
      })
    });

    if (!response.ok || !response.body) {
      throw new Error(`Erreur API: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const block of lines) {
        if (!block.trim()) continue;
        const eventMatch = block.match(/event:\s*(\w+)/);
        const dataMatch = block.match(/data:\s*(.+)/s);

        if (eventMatch && dataMatch) {
          const eventType = eventMatch[1];
          const rawData = dataMatch[1];
          try {
            const parsed = JSON.parse(rawData);
            if (eventType === 'metadata') {
              onMetadata(parsed);
            } else if (eventType === 'token') {
              onToken(parsed.token);
            } else if (eventType === 'done') {
              onDone(parsed);
            }
          } catch (e) {
            console.error('Failed to parse SSE payload', e);
          }
        }
      }
    }
  } catch (err) {
    onError(err);
  }
}
