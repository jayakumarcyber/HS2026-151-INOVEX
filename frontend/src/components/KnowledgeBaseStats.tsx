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
      } catch (err) {
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
      title: 'Ingested Documents',
      value: totalDocs.toString(),
      subtitle: totalDocs === 1 ? '1 PDF file in repository' : `${totalDocs} PDF files in repository`,
      icon: Files,
      color: 'from-blue-500/20 to-indigo-500/10',
      iconColor: 'text-blue-400',
    },
    {
      title: 'Extracted Pages',
      value: `${totalPages} pages`,
      subtitle: `${processedDocs.length} of ${totalDocs} documents processed`,
      icon: FileCheck,
      color: 'from-emerald-500/20 to-teal-500/10',
      iconColor: 'text-emerald-400',
    },
    {
      title: 'FAISS Vector Index',
      value: indexStatus?.is_indexed ? `${indexStatus.chunks_count} Chunks` : 'Unindexed',
      subtitle: indexStatus?.is_indexed
        ? `all-MiniLM-L6-v2 (384d)`
        : 'Process PDFs to index vectors',
      icon: Layers,
      color: 'from-violet-500/20 to-purple-500/10',
      iconColor: 'text-violet-400',
    },
    {
      title: 'Security & PII Guard',
      value: 'Active',
      subtitle: 'Path traversal & MIME shielded',
      icon: Shield,
      color: 'from-amber-500/20 to-orange-500/10',
      iconColor: 'text-amber-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className="glass-panel p-4 rounded-xl relative overflow-hidden transition-all duration-200 hover:border-slate-700/80 group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400">{stat.title}</p>
                <p className="text-xl font-bold text-slate-100 mt-1">{stat.value}</p>
                <p className="text-[11px] text-slate-400 mt-1">{stat.subtitle}</p>
              </div>
              <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.color} border border-white/5`}>
                <Icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
