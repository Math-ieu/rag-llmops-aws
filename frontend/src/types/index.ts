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
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: SourceChunk[];
  traceId?: string;
  metrics?: QueryMetrics;
  feedbackGiven?: number; // 1 for +1, -1 for -1
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
