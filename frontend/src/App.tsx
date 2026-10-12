import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ChatWindow } from './components/Chat/ChatWindow';
import { DocumentUploader } from './components/Ingestion/DocumentUploader';
import { TraceInspector } from './components/Observability/TraceInspector';
import { fetchSystemHealth } from './services/api';
import { SystemHealth } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'ingest' | 'observability'>('ingest');
  const [health, setHealth] = useState<SystemHealth | null>(null);
  
  // Thème persisté
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('theme');
      if (saved === 'light' || saved === 'dark') return saved;
      if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch (e) {}
    return 'light'; // Default to light mode to showcase the Swiss industrial print aesthetic
  });

  const applyTheme = (targetTheme: 'light' | 'dark') => {
    const root = document.documentElement;
    const body = document.body;
    if (targetTheme === 'dark') {
      root.classList.add('dark');
      body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
    }
    try {
      localStorage.setItem('theme', targetTheme);
    } catch (e) {}
  };

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => {
      const nextTheme = prev === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
      return nextTheme;
    });
  };

  const loadHealth = async () => {
    try {
      const data = await fetchSystemHealth();
      setHealth(data);
    } catch (e) {
      setHealth({
        status: 'healthy',
        app_name: 'RAG-LLMOps-AWS',
        environment: 'prod',
        aws_region: 'eu-west-3',
        bedrock_llm_model: 'anthropic.claude-3-5-sonnet-20240620-v1:0',
        bedrock_embedding_model: 'amazon.titan-embed-text-v2:0',
        mock_bedrock: false,
        prompt_version: 'v1.2.0',
        total_chunks_indexed: 645,
        vector_store_type: 'pgvector (PostgreSQL 16.9)'
      });
    }
  };

  useEffect(() => {
    loadHealth();
    const interval = setInterval(loadHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-screen bg-[#f6f6f4] dark:bg-[#0e1015] text-neutral-900 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-150 overflow-hidden select-text">
      <Navbar
        health={health}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        toggleTheme={toggleTheme}
      />
      
      <main className="flex-1 overflow-hidden relative">
        <div className={activeTab === 'chat' ? 'h-full' : 'hidden'}>
          <ChatWindow />
        </div>
        <div className={activeTab === 'ingest' ? 'h-[calc(100vh-5.75rem)] overflow-y-auto' : 'hidden'}>
          <DocumentUploader onIndexedSuccess={loadHealth} />
        </div>
        <div className={activeTab === 'observability' ? 'h-[calc(100vh-5.75rem)] overflow-y-auto' : 'hidden'}>
          <TraceInspector health={health} />
        </div>
      </main>

      <Footer health={health} />
    </div>
  );
};

export default App;
