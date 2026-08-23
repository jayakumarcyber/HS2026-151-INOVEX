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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-purple-950/40 border border-indigo-500/20 p-6 md:p-8">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Phase 4 &bull; Grounded RAG &amp; Zero-Hallucination Answering Active</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Enterprise Document Intelligence
            </h2>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              Upload enterprise PDF documentation to chunk, embed, index in FAISS, and generate strictly document-grounded answers powered by Google Gemini with source citations and refusal fallbacks.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Terminal className="w-4 h-4" />
              </div>
              <div>
                <p className="font-medium text-slate-200">Backend Status</p>
                <p className="font-mono text-[11px] text-slate-400">
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

      {/* Architecture & Phase Roadmap Footer Banner */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400 flex-shrink-0" />
          <span>
            <strong className="text-slate-200">Phase 4 Grounded RAG:</strong> Vector retrieval, evidence sufficiency check, prompt injection defense, Gemini LLM synthesis, source citations, and `/api/ask` active.
          </span>
        </div>
        <div className="flex items-center gap-2 text-emerald-400 font-medium whitespace-nowrap">
          <ShieldCheck className="w-4 h-4" />
          <span>Zero-Hallucination Shield Active</span>
        </div>
      </div>
    </main>
  );
};
