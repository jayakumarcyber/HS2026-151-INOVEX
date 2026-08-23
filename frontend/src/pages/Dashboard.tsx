import React from 'react';
import { KnowledgeBaseStats } from '../components/KnowledgeBaseStats';
import { DocumentSection } from '../components/DocumentSection';
import { ChatSection } from '../components/ChatSection';
import { HealthState, DocumentItem } from '../types';
import { Sparkles, Terminal, Layers, ShieldCheck } from 'lucide-react';

interface DashboardProps {
  health: HealthState;
  documents: DocumentItem[];
  isDocsLoading: boolean;
  onRefreshDocuments: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  health,
  documents,
  isDocsLoading,
  onRefreshDocuments,
}) => {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Hero / System Overview Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-dark-900 via-dark-850 to-dark-900 border border-emerald-500/20 p-6 md:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-pulse-slow" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">
                <Sparkles className="w-3.5 h-3.5" />
                ✦ GROUNDED AI
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                ZERO-HALLUCINATION GUARD
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gradient-emerald">
              Enterprise Knowledge Intelligence
            </h2>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed font-normal">
              Ask questions. Retrieve evidence. Get grounded answers.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="p-4 rounded-xl bg-dark-950/80 border border-emerald-500/20 text-xs text-slate-300 flex items-center gap-3 shadow-md">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Terminal className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-white">Backend Status</p>
                <p className="font-mono text-[11px] text-emerald-400/90">
                  {health.data ? `${health.data.service} (v0.1.0)` : 'Connecting...'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <KnowledgeBaseStats documents={documents} />

      {/* Core Workspace Layout: Document Knowledge Base & Grounded Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[560px]">
        {/* Documents Knowledge Management (5 cols on lg) */}
        <div className="lg:col-span-5">
          <DocumentSection
            documents={documents}
            isLoading={isDocsLoading}
            onRefresh={onRefreshDocuments}
          />
        </div>

        {/* Knowledge Assistant Interaction (7 cols on lg) */}
        <div className="lg:col-span-7">
          <ChatSection />
        </div>
      </div>

      {/* Architecture Footer Banner */}
      <div className="glass-panel p-4 rounded-xl border border-emerald-500/15 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>
            <strong className="text-white">Grounding System Active:</strong> Document ingestion, sliding-window chunking, FAISS vector retrieval, evidence relevance gate, Gemini LLM synthesis, source citations &amp; prompt injection defense operational.
          </span>
        </div>
        <div className="flex items-center gap-2 text-emerald-400 font-semibold whitespace-nowrap">
          <ShieldCheck className="w-4 h-4" />
          <span>Zero-Hallucination Shield Active</span>
        </div>
      </div>
    </main>
  );
};
