import React from 'react';
import { KnowledgeBaseStats } from '../components/KnowledgeBaseStats';
import { DocumentSection } from '../components/DocumentSection';
import { ChatSection } from '../components/ChatSection';
import { DocumentItem } from '../types';

interface DashboardProps {
  documents: DocumentItem[];
  isDocsLoading: boolean;
  onRefreshDocuments: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  documents,
  isDocsLoading,
  onRefreshDocuments,
}) => {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* 1. Page Introduction Section */}
      <div className="saas-card p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-[#F5F7F6] tracking-tight">
            Ask questions. Get answers from your knowledge.
          </h2>
          <p className="text-xs text-[#A7B3AC] mt-1 leading-relaxed max-w-2xl font-normal">
            Upload your documents, build a searchable knowledge base, and interact with your content using natural language.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#738078] bg-[#101F17] px-3 py-1.5 rounded-md border border-[#1C3326]">
          <span className="w-2 h-2 rounded-full bg-[#22C55E]"></span>
          <span>Zero-Hallucination Guard Active</span>
        </div>
      </div>

      {/* 2. Knowledge Base Overview (Stats Row) */}
      <KnowledgeBaseStats documents={documents} />

      {/* 3. Core Workspace Layout: Document Management & Grounded Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[560px]">
        {/* Document Management (5 cols on lg) */}
        <div className="lg:col-span-5">
          <DocumentSection
            documents={documents}
            isLoading={isDocsLoading}
            onRefresh={onRefreshDocuments}
          />
        </div>

        {/* Grounded Knowledge Assistant Workspace (7 cols on lg) */}
        <div className="lg:col-span-7">
          <ChatSection />
        </div>
      </div>
    </main>
  );
};
