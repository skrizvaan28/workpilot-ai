import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  AlertTriangle,
  ArrowRight,
  Target,
  TrendingUp,
  RefreshCw,
  CheckCircle2,
  Cpu,
  CheckSquare,
  ChevronDown,
  Sliders,
} from 'lucide-react';
import { AIInsight, Task, TaskInsight } from '../../types/dashboard';
import { AITaskInsightCard } from './AITaskInsightCard';
import { useTaskInsight } from '../../lib/taskInsight';
import { api } from '../../lib/api';

interface AIInsightCardProps {
  insights: AIInsight[];
  tasks?: Task[];
  onActionClick?: (insight: AIInsight) => void;
}

export const AIInsightCard: React.FC<AIInsightCardProps> = ({
  insights,
  tasks = [],
  onActionClick,
}) => {
  // Active task selection
  const activeTasks = tasks.filter((t) => t.status !== 'completed');
  const [selectedTaskId, setSelectedTaskId] = useState<string>(
    activeTasks[0]?.id || tasks[0]?.id || ''
  );

  // Sync if tasks change
  useEffect(() => {
    if (tasks.length > 0 && !tasks.some((t) => t.id === selectedTaskId)) {
      setSelectedTaskId(activeTasks[0]?.id || tasks[0]?.id || '');
    }
  }, [tasks, selectedTaskId]);

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) || tasks[0] || null;

  // Real backend hook for selected workspace task
  const {
    insight: workspaceInsight,
    loading: workspaceLoading,
    error: workspaceError,
    retry: retryWorkspace,
  } = useTaskInsight(selectedTask);

  // Custom task test mode
  const [mode, setMode] = useState<'workspace' | 'custom'>('workspace');
  const [customTitle, setCustomTitle] = useState('Complete WorkPilot documentation');
  const [customDeadline, setCustomDeadline] = useState('Tomorrow');
  const [customProgress, setCustomProgress] = useState<number>(20);
  const [customPriority, setCustomPriority] = useState('high');

  const [customInsight, setCustomInsight] = useState<TaskInsight | null>(null);
  const [customLoading, setCustomLoading] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);

  const handleAnalyzeCustom = async () => {
    if (!customTitle.trim()) return;
    setCustomLoading(true);
    setCustomError(null);
    try {
      const res = await api.taskInsight({
        title: customTitle,
        description: '',
        priority: customPriority,
        category: 'Documentation',
        due_date: customDeadline,
        progress: customProgress,
        assignee: '',
        urgency: customDeadline.toLowerCase().includes('tomorrow') ? 'due_today' : 'upcoming',
        completed: customProgress === 100,
      });
      setCustomInsight(res);
    } catch (err) {
      setCustomError(
        err instanceof Error
          ? err.message
          : 'AI insight temporarily unavailable. Please try again.'
      );
      setCustomInsight(null);
    } finally {
      setCustomLoading(false);
    }
  };

  const getInsightIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'urgent':
        return <AlertTriangle size={17} className="text-amber-400" />;
      case 'recommendation':
        return <Target size={17} className="text-blue-400" />;
      case 'improvement':
        return <TrendingUp size={17} className="text-emerald-400" />;
      default:
        return <Sparkles size={17} className="text-amber-400" />;
    }
  };

  const getBadgeStyle = (type: AIInsight['type']) => {
    switch (type) {
      case 'urgent':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'recommendation':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'improvement':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="relative rounded-xl bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 p-5 shadow-sm space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm">
            <Cpu size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-white text-base">
                WorkPilot AI Task Insight Engine
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/25 font-mono">
                Active Inference
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Multi-dimensional neural analysis of task priority, deadline risk, urgency, effort, and actions
            </p>
          </div>
        </div>

        {/* Mode selector pills */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-lg bg-slate-950 border border-slate-800 text-xs">
            <button
              onClick={() => setMode('workspace')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                mode === 'workspace'
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Workspace Task
            </button>
            <button
              onClick={() => {
                setMode('custom');
                if (!customInsight) {
                  void handleAnalyzeCustom();
                }
              }}
              className={`px-2.5 py-1 rounded-md font-medium transition flex items-center gap-1 ${
                mode === 'custom'
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders size={11} />
              Custom Analyzer
            </button>
          </div>
        </div>
      </div>

      {/* Main Active Task Insight Section */}
      {mode === 'workspace' ? (
        <div className="space-y-3">
          {/* Task selector dropdown */}
          {tasks.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <CheckSquare size={14} className="text-amber-400 shrink-0" />
                <span className="font-medium text-slate-300">Target Task:</span>
                <div className="relative">
                  <select
                    value={selectedTaskId}
                    onChange={(e) => setSelectedTaskId(e.target.value)}
                    className="appearance-none bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-md pl-2.5 pr-8 py-1 focus:outline-none focus:border-amber-500 transition"
                  >
                    {tasks.map((t) => (
                      <option key={t.id} value={t.id}>
                        [{t.id}] {t.title} ({t.progress}% • Due {t.dueDate})
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={12}
                    className="absolute right-2 top-2 text-slate-400 pointer-events-none"
                  />
                </div>
              </div>

              <div className="text-[11px] text-slate-500 font-mono">
                {selectedTask?.category} • {selectedTask?.status.toUpperCase()}
              </div>
            </div>
          )}

          {/* Connected Live Task Insight Card */}
          <AITaskInsightCard
            insight={workspaceInsight}
            loading={workspaceLoading}
            error={workspaceError}
            onRetry={retryWorkspace}
            taskTitle={selectedTask ? `[${selectedTask.id}] ${selectedTask.title}` : undefined}
          />
        </div>
      ) : (
        /* Custom Task Analyzer Mode (great for testing custom cases like documentation) */
        <div className="space-y-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Task Title
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="e.g. Complete WorkPilot documentation"
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Deadline
              </label>
              <input
                type="text"
                value={customDeadline}
                onChange={(e) => setCustomDeadline(e.target.value)}
                placeholder="e.g. Tomorrow"
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                <span>Progress</span>
                <span className="font-mono text-amber-400">{customProgress}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={customProgress}
                onChange={(e) => setCustomProgress(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Priority
              </label>
              <select
                value={customPriority}
                onChange={(e) => setCustomPriority(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleAnalyzeCustom}
                disabled={customLoading || !customTitle.trim()}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition disabled:opacity-50"
              >
                <Sparkles size={13} />
                <span>{customLoading ? 'Analyzing...' : 'Run AI Analysis'}</span>
              </button>
            </div>
          </div>

          <AITaskInsightCard
            insight={customInsight}
            loading={customLoading}
            error={customError}
            onRetry={handleAnalyzeCustom}
            taskTitle={customTitle}
          />
        </div>
      )}

      {/* 3 Executive Insight Cards Grid */}
      <div className="pt-2 border-t border-slate-800/80">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Executive Delivery Signals
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {insights.map((insight) => (
            <div
              key={insight.id}
              className="flex flex-col justify-between p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span
                    className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded border ${getBadgeStyle(
                      insight.type
                    )}`}
                  >
                    {insight.badgeText}
                  </span>
                  <div className="p-1 rounded-md bg-slate-900 border border-slate-800">
                    {getInsightIcon(insight.type)}
                  </div>
                </div>

                <h4 className="text-sm font-semibold text-white leading-snug group-hover:text-amber-300 transition-colors">
                  {insight.headline}
                </h4>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  {insight.description}
                </p>
              </div>

              <div className="pt-4 mt-3 border-t border-slate-800/80 flex items-center justify-between">
                {insight.impactScore && (
                  <span className="text-[11px] text-slate-400 font-mono">
                    {insight.impactScore}
                  </span>
                )}

                {insight.actionText && (
                  <button
                    onClick={() => onActionClick && onActionClick(insight)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 hover:text-amber-300 transition"
                  >
                    <span>{insight.actionText}</span>
                    <ArrowRight size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
