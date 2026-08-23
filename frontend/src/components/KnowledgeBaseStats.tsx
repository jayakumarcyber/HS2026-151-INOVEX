import React from 'react';
import { Files, Layers, Shield, Cpu } from 'lucide-react';

export const KnowledgeBaseStats: React.FC = () => {
  const stats = [
    {
      title: 'Indexed Documents',
      value: '0',
      subtitle: 'PDF, TXT, MD supported',
      icon: Files,
      color: 'from-blue-500/20 to-indigo-500/10',
      iconColor: 'text-blue-400',
    },
    {
      title: 'Vector Embeddings',
      value: '0 chunks',
      subtitle: 'FAISS Index ready',
      icon: Layers,
      color: 'from-violet-500/20 to-purple-500/10',
      iconColor: 'text-violet-400',
    },
    {
      title: 'Security & PII Guard',
      value: 'Enabled',
      subtitle: 'Pre-flight sanitization',
      icon: Shield,
      color: 'from-emerald-500/20 to-teal-500/10',
      iconColor: 'text-emerald-400',
    },
    {
      title: 'Grounding Engine',
      value: 'Phase 1 Ready',
      subtitle: 'Target: Gemini 1.5 Flash / Pro',
      icon: Cpu,
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
