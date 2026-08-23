import React from 'react';
import { UploadCloud, FileText, Lock, FileSpreadsheet, FileCode, CheckCircle } from 'lucide-react';

export const DocumentSection: React.FC = () => {
  return (
    <div className="glass-panel rounded-2xl p-6 flex flex-col h-full border border-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
        <div>
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" />
            Knowledge Repository
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage ingested documents and domain vector sources
          </p>
        </div>
        <span className="px-2 py-1 rounded text-[11px] font-medium bg-slate-900 text-slate-400 border border-slate-800">
          0 Documents
        </span>
      </div>

      {/* Upload Dropzone Placeholder */}
      <div className="mt-5 border-2 border-dashed border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center text-center bg-slate-900/30 hover:bg-slate-900/50 transition-colors group cursor-not-allowed">
        <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
          <UploadCloud className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-medium text-slate-200 mt-3">
          Document Ingestion Hub
        </h3>
        <p className="text-xs text-slate-400 max-w-xs mt-1">
          Supports PDF, Markdown, TXT, and DOCX documents with automated text chunking.
        </p>
        <div className="mt-3 flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-800/60 border border-slate-700/50 text-[11px] text-slate-400">
          <Lock className="w-3 h-3 text-amber-400" />
          <span>Ingestion pipeline unlocks in Phase 2</span>
        </div>
      </div>

      {/* Empty State / Ingestion Pipeline Features List */}
      <div className="mt-6 flex-1 flex flex-col">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Planned Knowledge Pipeline (Phase 2 & 3)
        </h4>
        <div className="space-y-2.5 flex-1">
          <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800/60 flex items-start gap-3">
            <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-400 mt-0.5">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-200">PDF & Document Parsing</p>
              <p className="text-[11px] text-slate-400">Extracts clean text, structured tables, and metadata.</p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800/60 flex items-start gap-3">
            <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-400 mt-0.5">
              <FileCode className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-200">Semantic Chunking & FAISS</p>
              <p className="text-[11px] text-slate-400">Dynamic sliding-window overlap and vector indexing.</p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800/60 flex items-start gap-3">
            <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400 mt-0.5">
              <CheckCircle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-200">Strict Source Grounding</p>
              <p className="text-[11px] text-slate-400">Page-level citations with fallback &quot;I don&apos;t know&quot; safety.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
