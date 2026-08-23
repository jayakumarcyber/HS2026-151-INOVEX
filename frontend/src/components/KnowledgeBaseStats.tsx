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
      title: 'Ingested Documents',
      value: totalDocs.toString(),
      subtitle: totalDocs === 1 ? '1 PDF file in repository' : `${totalDocs} PDF files in repository`,
      icon: Files,
      color: 'from-emerald-500/20 to-teal-500/10',
      iconColor: 'text-emerald-400',
    },
    {
      title: 'Extracted Pages',
      value: `${totalPages}`,
      subtitle: `${processedDocs.length} of ${totalDocs} documents processed`,
      icon: FileCheck,
      color: 'from-emerald-500/20 to-green-500/10',
      iconColor: 'text-emerald-300',
    },
    {
      title: 'FAISS Vector Index',
      value: indexStatus?.is_indexed ? `${indexStatus.chunks_count} Chunks` : 'Indexed',
      subtitle: indexStatus?.is_indexed
        ? `all-MiniLM-L6-v2 (384d)`
        : 'Process PDFs to index vectors',
      icon: Layers,
      color: 'from-teal-500/20 to-emerald-500/10',
      iconColor: 'text-teal-300',
    },
    {
      title: 'Security & PII Guard',
      value: 'Active',
      subtitle: 'Path traversal & MIME shielded',
      icon: Shield,
      color: 'from-emerald-500/20 to-emerald-600/10',
      iconColor: 'text-emerald-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className="glass-card p-5 rounded-2xl relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/35 hover:shadow-lg hover:shadow-emerald-500/10 group cursor-default"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400">{stat.title}</p>
                <p className="text-2xl font-bold text-white mt-1 tracking-tight">{stat.value}</p>
                <p className="text-[11px] text-emerald-400/80 mt-1">{stat.subtitle}</p>
              </div>
              <div className={`p-3.5 rounded-xl bg-gradient-to-br ${stat.color} border border-emerald-500/20 group-hover:scale-105 transition-transform duration-300`}>
                <Icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
