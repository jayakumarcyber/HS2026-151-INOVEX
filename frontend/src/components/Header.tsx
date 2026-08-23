import React from 'react';
import { Database, Sparkles } from 'lucide-react';
import { HealthState } from '../types';
import { StatusIndicator } from './StatusIndicator';

interface HeaderProps {
  health: HealthState;
  onRefreshHealth: () => void;
}

export const Header: React.FC<HeaderProps> = ({ health, onRefreshHealth }) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-emerald-500/15 bg-dark-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-xl blur opacity-40 group-hover:opacity-75 transition duration-300"></div>
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-dark-900 border border-emerald-500/30 text-emerald-400">
                <Database className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">
                  AI Powered Knowledge Assistant
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Sparkles className="w-2.5 h-2.5" />
                  GROUNDED AI
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Document-Grounded Intelligence
              </p>
            </div>
          </div>

          {/* Right Status Actions */}
          <div className="flex items-center gap-3">
            <StatusIndicator health={health} onRefresh={onRefreshHealth} />
          </div>
        </div>
      </div>
    </header>
  );
};
