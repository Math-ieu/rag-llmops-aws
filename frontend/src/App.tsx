import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ChatWindow } from './components/Chat/ChatWindow';
import { DocumentUploader } from './components/Ingestion/DocumentUploader';
import { TraceInspector } from './components/Observability/TraceInspector';
import { fetchSystemHealth } from './services/api';
import { ChatMessage, SystemHealth } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'ingest' | 'observability'>('chat');
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const loadHealth = async () => {
    try {
      const data = await fetchSystemHealth();
      setHealth(data);
    } catch (e) {
      console.warn('Backend not ready yet, using default health mock data');
      setHealth({
        status: 'healthy',
        app_name: 'RAG-LLMOps-AWS',
        environment: 'development',
        aws_region: 'us-east-1',
        bedrock_llm_model: 'anthropic.claude-3-5-sonnet-20240620-v1:0',
        bedrock_embedding_model: 'amazon.titan-embed-text-v2:0',
        mock_bedrock: false,
        prompt_version: 'v1.2.0',
        total_chunks_indexed: 12,
        vector_store_type: 'pgvector (PostgreSQL)'
      });
    }
  };

  useEffect(() => {
    loadHealth();
    const interval = setInterval(loadHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      <Navbar health={health} activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 overflow-hidden">
        {activeTab === 'chat' && (
          <ChatWindow messages={messages} setMessages={setMessages} />
        )}
        {activeTab === 'ingest' && (
          <div className="h-[calc(100vh-4rem)] overflow-y-auto">
            <DocumentUploader onIndexedSuccess={loadHealth} />
          </div>
        )}
        {activeTab === 'observability' && (
          <div className="h-[calc(100vh-4rem)] overflow-y-auto">
            <TraceInspector health={health} />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
