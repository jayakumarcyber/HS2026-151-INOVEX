import React from 'react';
import { RefreshCw } from 'lucide-react';
import { HealthState } from '../types';

interface StatusIndicatorProps {
  health: HealthState;
  onRefresh: () => void;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ health, onRefresh }) => {
  return (
    <div className="flex items-center gap-2.5">
      {health.status === 'checking' && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#101F17] text-[#A7B3AC] border border-[#1C3326]">
          <RefreshCw className="w-3 h-3 animate-spin text-[#16A34A]" />
          <span>Connecting...</span>
        </div>
      )}

      {health.status === 'connected' && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#101F17] text-[#F5F7F6] border border-[#1C3326]">
          <span className="w-2 h-2 rounded-full bg-[#22C55E]"></span>
          <span>Backend Online</span>
          {health.latencyMs !== null && (
            <span className="text-[#738078] text-[11px]">({health.latencyMs}ms)</span>
          )}
        </div>
      )}

      {health.status === 'disconnected' && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#101F17] text-[#EF4444] border border-[#1C3326]">
          <span className="w-2 h-2 rounded-full bg-[#EF4444]"></span>
          <span>Backend Offline</span>
        </div>
      )}

      <button
        onClick={onRefresh}
        title="Refresh backend status"
        className="p-1 text-[#738078] hover:text-[#16A34A] rounded-md transition-colors"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${health.status === 'checking' ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
};
