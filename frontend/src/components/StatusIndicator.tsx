import React from 'react';
import { Activity, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { HealthState } from '../types';

interface StatusIndicatorProps {
  health: HealthState;
  onRefresh: () => void;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ health, onRefresh }) => {
  return (
    <div className="flex items-center gap-3">
      {health.status === 'checking' && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <Activity className="w-3.5 h-3.5 animate-spin" />
          <span>Connecting to Backend...</span>
        </div>
      )}

      {health.status === 'connected' && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 shadow-sm shadow-emerald-500/10">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-medium">Backend Online</span>
          {health.latencyMs !== null && (
            <span className="text-emerald-500/80 font-mono text-[11px]">({health.latencyMs}ms)</span>
          )}
        </div>
      )}

      {health.status === 'disconnected' && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <span className="relative flex h-2 w-2">
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
          </span>
          <XCircle className="w-3.5 h-3.5 text-rose-400" />
          <span className="font-medium">Backend Offline</span>
        </div>
      )}

      <button
        onClick={onRefresh}
        title="Refresh backend status"
        className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors border border-emerald-500/15"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${health.status === 'checking' ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
};
