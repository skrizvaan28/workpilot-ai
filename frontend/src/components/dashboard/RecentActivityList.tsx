import React from 'react';
import {
  Clock,
  Bot,
  CheckCircle2,
  Sparkles,
  FileText,
  Zap,
  Activity,
} from 'lucide-react';
import { RecentActivityItem } from '../../types/dashboard';

interface RecentActivityListProps {
  activities: RecentActivityItem[];
}

export const RecentActivityList: React.FC<RecentActivityListProps> = ({ activities }) => {
  const getActivityIcon = (type: RecentActivityItem['type']) => {
    switch (type) {
      case 'ai_agent':
        return <Bot size={15} className="text-amber-400" />;
      case 'task':
        return <CheckCircle2 size={15} className="text-emerald-400" />;
      case 'document':
        return <FileText size={15} className="text-blue-400" />;
      case 'productivity':
        return <Zap size={15} className="text-amber-400" />;
      default:
        return <Sparkles size={15} className="text-purple-400" />;
    }
  };

  return (
    <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <Activity size={18} className="text-amber-400" />
          <h3 className="font-display font-semibold text-white text-base">
            Recent Workspace Activity
          </h3>
        </div>
        <span className="text-xs text-slate-400 flex items-center gap-1">
          <Clock size={12} /> Live stream
        </span>
      </div>

      <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
        {activities.map((item) => (
          <div key={item.id} className="relative group">
            {/* Timeline icon node */}
            <div className="absolute -left-6 top-1 h-4 w-4 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center group-hover:border-amber-400 transition">
              <div className="h-1.5 w-1.5 rounded-full bg-slate-400 group-hover:bg-amber-400 transition" />
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/70 hover:border-slate-700 transition">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-slate-800/80 border border-slate-700/50">
                    {getActivityIcon(item.type)}
                  </div>
                  <strong className="text-xs font-semibold text-slate-200">
                    {item.title}
                  </strong>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  {item.timestamp}
                </span>
              </div>
              <p className="text-xs text-slate-300 pl-7 leading-relaxed">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
