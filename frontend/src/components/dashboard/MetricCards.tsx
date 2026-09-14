import React from 'react';
import {
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';

interface MetricCardsProps {
  userName?: string;
  productivityScore?: number;
  completedTasksCount: number;
  totalTasksCount: number;
  pendingTasksCount: number;
  overdueTasksCount: number;
  streakDays?: number;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  userName = 'Rizvaan',
  productivityScore = 94,
  completedTasksCount = 18,
  totalTasksCount = 24,
  pendingTasksCount = 6,
  overdueTasksCount = 1,
  streakDays = 14,
}) => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const completionPercentage = Math.round((completedTasksCount / Math.max(totalTasksCount, 1)) * 100);

  return (
    <div className="space-y-5">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-display font-bold text-white tracking-tight">
              Good morning, {userName}
            </h1>
            <span className="text-xl">👋</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            WorkPilot AI has prioritized your workspace for maximum focus. Here is your daily overview.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-300 font-mono">
            📅 {currentDate}
          </div>
        </div>
      </div>

      {/* 5 Core Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. Today's Productivity Score */}
        <div className="relative overflow-hidden rounded-xl bg-slate-900/80 border border-slate-800 p-4 hover:border-amber-500/30 transition-all duration-200 group shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-medium text-slate-300">Productivity Score</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Sparkles size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-display font-bold text-white">
              {productivityScore}%
            </span>
            <span className="inline-flex items-center text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
              <TrendingUp size={12} className="mr-0.5" /> +6.2%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            AI velocity index based on completed milestones
          </p>
          <div className="mt-3 w-full bg-slate-800 h-1 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${productivityScore}%` }}
            />
          </div>
        </div>

        {/* 2. Tasks Completed */}
        <div className="relative overflow-hidden rounded-xl bg-slate-900/80 border border-slate-800 p-4 hover:border-emerald-500/30 transition-all duration-200 group shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-medium text-slate-300">Tasks Completed</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-display font-bold text-white">
              {completedTasksCount}
              <span className="text-slate-500 text-lg font-normal">/{totalTasksCount}</span>
            </span>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
              {completionPercentage}%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {totalTasksCount - completedTasksCount} remaining in sprint queue
          </p>
          <div className="mt-3 w-full bg-slate-800 h-1 rounded-full overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* 3. Pending Tasks */}
        <div className="relative overflow-hidden rounded-xl bg-slate-900/80 border border-slate-800 p-4 hover:border-blue-500/30 transition-all duration-200 group shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-medium text-slate-300">Pending Tasks</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <Clock size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-display font-bold text-white">
              {pendingTasksCount}
            </span>
            <span className="text-[11px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
              3 High Priority
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            2 items waiting on cross-team dependencies
          </p>
          <div className="mt-3 w-full bg-slate-800 h-1 rounded-full overflow-hidden">
            <div
              className="bg-blue-400 h-full rounded-full"
              style={{ width: '60%' }}
            />
          </div>
        </div>

        {/* 4. Overdue Tasks */}
        <div className="relative overflow-hidden rounded-xl bg-slate-900/80 border border-slate-800 p-4 hover:border-rose-500/40 transition-all duration-200 group shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-medium text-slate-300">Overdue Tasks</span>
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-display font-bold text-rose-400">
              {overdueTasksCount}
            </span>
            <span className="text-[11px] font-semibold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">
              Needs Review
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Vendor contracts reconciliation flagged
          </p>
          <div className="mt-3 w-full bg-slate-800 h-1 rounded-full overflow-hidden">
            <div
              className="bg-rose-500 h-full rounded-full"
              style={{ width: overdueTasksCount > 0 ? '100%' : '0%' }}
            />
          </div>
        </div>

        {/* 5. Current Streak */}
        <div className="relative overflow-hidden rounded-xl bg-slate-900/80 border border-slate-800 p-4 hover:border-amber-500/30 transition-all duration-200 group shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-medium text-slate-300">Current Streak</span>
            <div className="p-1.5 rounded-lg bg-gradient-to-tr from-amber-500/20 to-orange-500/20 text-amber-400">
              <Flame size={16} className="fill-amber-400/20" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-display font-bold text-white">
              {streakDays}{' '}
              <span className="text-xs sm:text-sm font-normal text-slate-400">Days</span>
            </span>
            <span className="text-[11px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded flex items-center">
              Top 5%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
            <span>Personal best: 21 days</span>
            <ArrowUpRight size={13} className="text-amber-400" />
          </p>
          <div className="mt-3 w-full bg-slate-800 h-1 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-orange-500 to-amber-400 h-full rounded-full"
              style={{ width: `${Math.min((streakDays / 21) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
