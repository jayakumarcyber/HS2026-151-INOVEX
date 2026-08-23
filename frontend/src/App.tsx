import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { apiService } from './services/api';
import { HealthState, DocumentItem } from './types';

export const App: React.FC = () => {
  const [health, setHealth] = useState<HealthState>({
    status: 'checking',
    data: null,
    latencyMs: null,
    errorMessage: null,
    lastChecked: null,
  });

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isDocsLoading, setIsDocsLoading] = useState(false);

  const fetchDocuments = useCallback(async () => {
    setIsDocsLoading(true);
    try {
      const docs = await apiService.getDocuments();
      setDocuments(docs);
    } catch {
      // Keep existing list if backend loading
    } finally {
      setIsDocsLoading(false);
    }
  }, []);

  const checkBackendHealth = useCallback(async () => {
    setHealth((prev) => ({ ...prev, status: 'checking', errorMessage: null }));
    try {
      const { data, latencyMs } = await apiService.checkHealth();
      setHealth({
        status: 'connected',
        data,
        latencyMs,
        errorMessage: null,
        lastChecked: new Date(),
      });
      fetchDocuments();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unable to connect to backend';
      setHealth({
        status: 'disconnected',
        data: null,
        latencyMs: null,
        errorMessage: errorMsg,
        lastChecked: new Date(),
      });
    }
  }, [fetchDocuments]);

  useEffect(() => {
    checkBackendHealth();
    const interval = setInterval(() => {
      checkBackendHealth();
    }, 30000);
    return () => clearInterval(interval);
  }, [checkBackendHealth]);

  return (
    <div className="min-h-screen bg-[#07110C] text-[#F5F7F6] flex flex-col font-sans">
      <Header health={health} onRefreshHealth={checkBackendHealth} />

      <div className="flex-1">
        <Dashboard
          documents={documents}
          isDocsLoading={isDocsLoading}
          onRefreshDocuments={fetchDocuments}
        />
      </div>

      <footer className="border-t border-[#1C3326] py-3.5 text-center text-xs text-[#738078] bg-[#07110C]">
        <p>AI Powered Knowledge Assistant &bull; Repository: HS2026-151-INOVEX &bull; Document Grounded Knowledge Workspace</p>
      </footer>
    </div>
  );
};

export default App;
