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
      // If backend is unreachable, keep existing list or empty
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
    // Periodic health check and doc sync every 30 seconds
    const interval = setInterval(() => {
      checkBackendHealth();
    }, 30000);
    return () => clearInterval(interval);
  }, [checkBackendHealth]);

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100 flex flex-col relative selection:bg-emerald-500/30 selection:text-emerald-200 bg-grid-pattern">
      {/* Background Radial Ambient Glow */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-[120px] pointer-events-none" />

      <Header health={health} onRefreshHealth={checkBackendHealth} />

      <div className="flex-1 relative z-10">
        <Dashboard
          health={health}
          documents={documents}
          isDocsLoading={isDocsLoading}
          onRefreshDocuments={fetchDocuments}
        />
      </div>

      <footer className="border-t border-emerald-500/10 py-4 text-center text-xs text-slate-400 relative z-10 bg-dark-950/80 backdrop-blur-md">
        <p>AI Powered Knowledge Assistant &bull; Repository: HS2026-151-INOVEX &bull; Grounded Document Intelligence</p>
      </footer>
    </div>
  );
};

export default App;
