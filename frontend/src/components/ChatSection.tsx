import React from 'react';
import { MessageSquare, Sparkles, Send, ShieldAlert, BookOpen, Search } from 'lucide-react';

export const ChatSection: React.FC = () => {
  return (
    <div className="glass-panel rounded-2xl p-6 flex flex-col h-full border border-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
        <div>
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-400" />
            Grounded Knowledge Assistant
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Query your verified documents with zero-hallucination guardrails
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          <span>RAG Query Engine</span>
        </div>
      </div>

      {/* Main Conversation Canvas (Empty State) */}
      <div className="my-auto py-10 flex flex-col items-center justify-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 shadow-inner">
          <BookOpen className="w-7 h-7" />
        </div>
        <h3 className="text-base font-semibold text-slate-200">
          Knowledge Base Awaiting Documents
        </h3>
        <p className="text-xs text-slate-400 max-w-md mt-1.5 leading-relaxed">
          In Phase 2 &amp; 3, the assistant will synthesize grounded answers solely from ingested documentation, providing verified citations and refusing out-of-domain answers.
        </p>

        {/* Example Prompt Placeholders */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-lg">
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 text-left cursor-not-allowed opacity-75">
            <p className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Search className="w-3 h-3 text-indigo-400" /> &quot;Summarize Section 4 compliance...&quot;
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Citation-grounded synthesis</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 text-left cursor-not-allowed opacity-75">
            <p className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <ShieldAlert className="w-3 h-3 text-emerald-400" /> &quot;What are the policy guidelines?&quot;
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">PII &amp; Hallucination-free</p>
          </div>
        </div>
      </div>

      {/* Disabled Input Bar Placeholder */}
      <div className="mt-auto pt-4 border-t border-slate-800/80">
        <div className="relative flex items-center">
          <input
            type="text"
            disabled
            placeholder="Document querying will be activated once knowledge base is indexed..."
            className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-400 placeholder-slate-400 cursor-not-allowed pr-12 focus:outline-none"
          />
          <button
            disabled
            className="absolute right-2 p-2 bg-indigo-600/30 text-indigo-400 rounded-lg cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-slate-400">
          <span>Supported: Multi-turn chat &bull; Direct paragraph citation &bull; Confidence scoring</span>
          <span className="text-indigo-400 font-mono">Phase 1</span>
        </div>
      </div>
    </div>
  );
};
