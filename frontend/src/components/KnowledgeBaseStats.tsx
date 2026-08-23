import React, { useEffect, useState } from 'react';
import { Files, Layers, Shield, FileCheck } from 'lucide-react';
import { DocumentItem, IndexStatusResponse } from '../types';
import { apiService } from '../services/api';

interface KnowledgeBaseStatsProps {
  documents: DocumentItem[];
}

export const KnowledgeBaseStats: React.FC<KnowledgeBaseStatsProps> = ({ documents }) => {
  const [indexStatus, setIndexStatus] = useState<IndexStatusResponse | null>(null);

  const totalDocs = documents.length;
  const processedDocs = documents.filter((d) => d.status === 'processed');
  const totalPages = processedDocs.reduce((acc, d) => acc + (d.pages || 0), 0);

  useEffect(() => {
    let isMounted = true;
    const fetchStatus = async () => {
      try {
        const res = await apiService.getIndexStatus();
        if (isMounted) setIndexStatus(res);
      } catch {
        // Fallback gracefully if backend is loading
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [documents]);

  const stats = [
    {
      label: 'Documents',
      value: totalDocs.toString(),
      status: totalDocs === 1 ? '1 PDF file' : `${totalDocs} PDF files`,
      icon: Files,
    },
    {
      label: 'Pages',
      value: totalPages.toString(),
      status: `${processedDocs.length} of ${totalDocs} processed`,
      icon: FileCheck,
    },
    {
      label: 'Knowledge Chunks',
      value: indexStatus?.is_indexed ? indexStatus.chunks_count.toString() : '0',
      status: indexStatus?.is_indexed ? 'FAISS vector indexed' : 'Awaiting processing',
      icon: Layers,
    },
    {
      label: 'Vector Index',
      value: indexStatus?.is_indexed ? 'Ready' : 'Unindexed',
      status: indexStatus?.is_indexed ? 'FAISS IndexFlatIP (384d)' : 'Upload PDF to build index',
      icon: Shield,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className="saas-card p-4 flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-medium text-[#A7B3AC]">{stat.label}</p>
              <p className="text-xl font-bold text-[#F5F7F6] mt-0.5 tracking-tight">{stat.value}</p>
              <p className="text-[11px] text-[#738078] mt-0.5">{stat.status}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-[#101F17] border border-[#1C3326] text-[#16A34A]">
              <Icon className="w-4 h-4" />
            </div>
          </div>
        );
      })}
    </div>
  );
};
