import { SystemHealth, IndexedDocument, LiveTelemetryMetrics } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'https://piajqcbwp3.eu-west-3.awsapprunner.com';

export async function fetchSystemHealth(): Promise<SystemHealth> {
  const res = await fetch(`${API_BASE}/api/system/health`);
  if (!res.ok) throw new Error('Impossible de contacter le backend');
  return res.json();
}

export async function fetchIndexedDocuments(): Promise<IndexedDocument[]> {
  try {
    const res = await fetch(`${API_BASE}/api/ingest/documents`);
    if (!res.ok) return [];
    return res.json();
  } catch (e) {
    return [];
  }
}

export async function deleteIndexedDocument(documentName: string): Promise<any> {
  const res = await fetch(`${API_BASE}/api/ingest/documents/${encodeURIComponent(documentName)}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Erreur lors de la suppression');
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
  onMetadata: (metadata: { 
    trace_id: string; 
    sources: any[]; 
    retrieval_ms: number;
    cache_hit?: boolean;
    cache_similarity?: number;
    guardrail_blocked?: boolean;
    pii_redacted?: boolean;
  }) => void,
  onToken: (token: string) => void,
  onDone: (metrics: { 
    total_latency_ms: number; 
    cost_usd: number; 
    tokens: number;
    cache_hit?: boolean;
    cache_similarity?: number;
    guardrail_blocked?: boolean;
  }) => void,
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

export async function fetchConversations(): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE}/api/chat/conversations`);
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function fetchConversation(id: string): Promise<any | null> {
  try {
    const res = await fetch(`${API_BASE}/api/chat/conversations/${encodeURIComponent(id)}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function saveConversationToBackend(id: string, title: string, messages: any[]): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/chat/conversations/${encodeURIComponent(id)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, messages })
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function deleteConversationFromBackend(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/chat/conversations/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchLiveTelemetry(): Promise<LiveTelemetryMetrics | null> {
  try {
    const res = await fetch(`${API_BASE}/api/system/telemetry`);
    if (!res.ok) return null;
    return res.json();
  } catch (e) {
    console.error('Error fetching live telemetry', e);
    return null;
  }
}
