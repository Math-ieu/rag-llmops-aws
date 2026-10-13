export interface SourceChunk {
  id: string;
  content: string;
  metadata: {
    source: string;
    page?: number;
    total_pages?: number;
    chunk_index?: number;
    char_length?: number;
  };
  similarity_score?: number;
  rrf_score?: number;
  rerank_score?: number;
}

export interface QueryMetrics {
  total_latency_ms: number;
  retrieval_latency_ms?: number;
  input_tokens?: number;
  output_tokens?: number;
  cost_usd?: number;
  model_id?: string;
  prompt_version?: string;
  cache_hit?: boolean;
  cache_similarity?: number;
  guardrail_blocked?: boolean;
  pii_redacted?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  sources?: SourceChunk[];
  traceId?: string;
  metrics?: QueryMetrics;
  feedbackGiven?: number; // 1 for +1, -1 for -1
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface SystemHealth {
  status: string;
  app_name: string;
  environment: string;
  aws_region: string;
  bedrock_llm_model: string;
  bedrock_embedding_model: string;
  mock_bedrock: boolean;
  prompt_version: string;
  total_chunks_indexed: number;
  vector_store_type: string;
}

export interface IndexedDocument {
  id: string;
  name: string;
  file_type: string;
  chunks_count: number;
  file_size_bytes?: number;
  status: 'indexed' | 'processing' | 'failed';
  created_at: string;
}

export interface LiveTelemetryMetrics {
  total_queries: number;
  avg_latency_ms: number;
  p95_latency_ms: number;
  p50_latency_ms: number;
  avg_cost_usd: number;
  total_cost_usd: number;
  cache_hits: number;
  cache_hit_rate: number;
  cost_saved_usd: number;
  faithfulness_score: number;
  llm_judge_score: number;
  satisfaction_rate: number;
  positive_feedback_count: number;
  negative_feedback_count: number;
  is_live: boolean;
  app_name?: string;
  environment?: string;
  aws_region?: string;
  bedrock_llm_model?: string;
  bedrock_embedding_model?: string;
  prompt_version?: string;
  total_chunks_indexed?: number;
  total_documents_count?: number;
  vector_store_type?: string;
  cache_backend?: string;
}

