import React from 'react';
import {
  PlusCircle,
  UploadCloud,
  Bot,
  BarChart3,
  ArrowRight,
} from 'lucide-react';

interface QuickActionsProps {
  onOpenCreateTask: () => void;
  onOpenUploadDocument: () => void;
  onOpenAskAI: () => void;
  onViewAnalytics: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onOpenCreateTask,
  onOpenUploadDocument,
  onOpenAskAI,
  onViewAnalytics,
}) => {
  const actions = [
    {
      id: 'create-task',
      title: 'Create Task',
      description: 'Add a new task with automated AI priority scoring & deadline estimates.',
      icon: PlusCircle,
      accent: 'amber',
      onClick: onOpenCreateTask,
      btnLabel: 'New Task',
    },
    {
      id: 'upload-doc',
      title: 'Upload Document',
      description: 'Ingest PRDs, specs, or contracts to automatically extract actionable tasks.',
      icon: UploadCloud,
      accent: 'blue',
      onClick: onOpenUploadDocument,
      btnLabel: 'Upload & Parse',
    },
    {
      id: 'ask-ai',
      title: 'Ask AI',
      description: 'Query your workspace, request sprint summaries, or draft status updates.',
      icon: Bot,
      accent: 'purple',
      onClick: onOpenAskAI,
      btnLabel: 'Launch Assistant',
    },
    {
      id: 'view-analytics',
      title: 'View Analytics',
      description: 'Inspect comprehensive velocity breakdowns, focus hours, and team capacity.',
      icon: BarChart3,
      accent: 'emerald',
      onClick: onViewAnalytics,
      btnLabel: 'Open Reports',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-white text-base">
          Quick Actions
        </h3>
        <span className="text-xs text-slate-400">Common productivity workflows</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.id}
              onClick={act.onClick}
              className="text-left p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition duration-150 group flex flex-col justify-between shadow-sm relative overflow-hidden"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-lg bg-slate-800 border border-slate-700/60 group-hover:border-amber-500/40 transition">
                    <Icon size={19} className="text-amber-400 group-hover:scale-110 transition" />
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium group-hover:text-amber-400 transition flex items-center gap-0.5">
                    Action <ArrowRight size={11} />
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-white group-hover:text-amber-300 transition">
                  {act.title}
                </h4>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed line-clamp-2">
                  {act.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 w-full flex items-center justify-between text-xs font-semibold text-slate-300 group-hover:text-white">
                <span>{act.btnLabel}</span>
                <span className="h-1.5 w-1.5 rounded-full bg-slate-600 group-hover:bg-amber-400 transition" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
