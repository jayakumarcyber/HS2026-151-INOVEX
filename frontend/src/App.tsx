import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { apiService } from './services/api';
import { HealthState } from './types';

export const App: React.FC = () => {
  const [health, setHealth] = useState<HealthState>({
    status: 'checking',
    data: null,
    latencyMs: null,
    errorMessage: null,
    lastChecked: null,
  });

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
  }, []);

  useEffect(() => {
    checkBackendHealth();
    // Periodic health check every 30 seconds
    const interval = setInterval(checkBackendHealth, 30000);
    return () => clearInterval(interval);
  }, [checkBackendHealth]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      <Header health={health} onRefreshHealth={checkBackendHealth} />
      <div className="flex-1">
        <Dashboard health={health} />
      </div>
      <footer className="border-t border-slate-800/60 py-4 text-center text-xs text-slate-400">
        <p>AI Powered Knowledge Assistant &bull; Repository: HS2026-151-INOVEX &bull; Phase 1 Foundation</p>
      </footer>
    </div>
  );
};

export default App;
