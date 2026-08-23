import React from 'react';
import { Database } from 'lucide-react';
import { HealthState } from '../types';
import { StatusIndicator } from './StatusIndicator';

interface HeaderProps {
  health: HealthState;
  onRefreshHealth: () => void;
}

export const Header: React.FC<HeaderProps> = ({ health, onRefreshHealth }) => {
  return (
    <header className="w-full border-b border-[#1C3326] bg-[#0B1711] py-3.5 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left Title & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#101F17] border border-[#1C3326] text-[#16A34A]">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-semibold text-[#F5F7F6] tracking-tight">
              AI Powered Knowledge Assistant
            </h1>
            <p className="text-xs text-[#A7B3AC]">
              Document-grounded knowledge workspace
            </p>
          </div>
        </div>

        {/* Right Status */}
        <div className="flex items-center gap-3">
          <StatusIndicator health={health} onRefresh={onRefreshHealth} />
        </div>
      </div>
    </header>
  );
};
