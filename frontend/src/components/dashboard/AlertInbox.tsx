import React from 'react';
import {
  Bell,
  AlertTriangle,
  Clock,
  CalendarClock,
  ArrowRight,
  CheckCircle2,
  Tag,
  Sparkles,
  Info,
} from 'lucide-react';
import { Task, TaskUrgency } from '../../types/dashboard';

interface AlertInboxProps {
  tasks: Task[];
  /** Navigates the user to the existing My Tasks tab */
  onNavigateToTasks: () => void;
}

// ─── Section configuration ────────────────────────────────────────────────────

interface UrgencySection {
  key: TaskUrgency;
  label: string;
  description: string;
  icon: React.ElementType;
  iconClass: string;
  headerClass: string;
  badgeClass: string;
  rowBorderClass: string;
}

const URGENCY_SECTIONS: UrgencySection[] = [
  {
    key: 'overdue',
    label: 'Overdue',
    description: 'These tasks have passed their deadline and require immediate attention.',
    icon: AlertTriangle,
    iconClass: 'text-rose-400',
    headerClass: 'border-rose-500/30 bg-rose-500/5',
    badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    rowBorderClass: 'hover:border-rose-500/30',
  },
  {
    key: 'due_today',
    label: 'Due Today',
    description: 'Tasks scheduled for completion before end of today.',
    icon: Clock,
    iconClass: 'text-amber-400',
    headerClass: 'border-amber-500/30 bg-amber-500/5',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    rowBorderClass: 'hover:border-amber-500/30',
  },
  {
    key: 'upcoming',
    label: 'Upcoming',
    description: 'Tasks due within the next 48 hours — plan ahead now.',
    icon: CalendarClock,
    iconClass: 'text-blue-400',
    headerClass: 'border-blue-500/30 bg-blue-500/5',
    badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    rowBorderClass: 'hover:border-blue-500/30',
  },
];

// ─── Priority badge ───────────────────────────────────────────────────────────

function PriorityChip({ priority }: { priority: Task['priority'] }) {
  const map = {
    high: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    low: 'bg-slate-800 text-slate-400 border-slate-700',
  } as const;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${map[priority]}`}
    >
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
}

// ─── Single alert row ─────────────────────────────────────────────────────────

interface AlertRowProps {
  task: Task;
  section: UrgencySection;
  onNavigateToTasks: () => void;
}

function AlertRow({ task, section, onNavigateToTasks }: AlertRowProps) {
  return (
    <div
      className={`group flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800/70 transition-all duration-150 ${section.rowBorderClass}`}
    >
      {/* Left: task info */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-mono text-slate-500">{task.id}</span>
          <PriorityChip priority={task.priority} />
        </div>

        <p className="text-sm font-medium text-slate-100 truncate" title={task.title}>
          {task.title}
        </p>

        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
          {/* Category */}
          <span className="flex items-center gap-1">
            <Tag size={11} />
            {task.category}
          </span>

          {/* Due date */}
          <span className="flex items-center gap-1">
            <Clock size={11} />
            {task.dueDate}
          </span>

          {/* Assignee */}
          {task.assignee && (
            <span className="flex items-center gap-1">
              <span className="h-4 w-4 rounded bg-slate-700 text-[9px] font-bold text-slate-200 flex items-center justify-center">
                {task.assignee.avatar}
              </span>
              {task.assignee.name}
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-slate-800 h-1 rounded-full overflow-hidden max-w-[120px]">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                task.urgency === 'overdue'
                  ? 'bg-rose-500'
                  : task.urgency === 'due_today'
                  ? 'bg-amber-400'
                  : 'bg-blue-400'
              }`}
              style={{ width: `${task.progress}%` }}
            />
          </div>
          <span className="text-[11px] font-mono text-slate-400">{task.progress}%</span>
        </div>

        {/* AI reasoning chip */}
        <p className="inline-flex items-center gap-1 text-[11px] text-slate-400">
          <Sparkles size={10} className="text-amber-400 shrink-0" />
          <span className="truncate max-w-xs" title={task.aiReasoning}>
            {task.aiReasoning}
          </span>
        </p>
      </div>

      {/* Right: action */}
      <button
        onClick={onNavigateToTasks}
        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:border-amber-500/50 hover:text-amber-300 text-slate-300 text-xs font-medium transition-all duration-150 group-hover:border-amber-500/40"
        title="View in My Tasks"
      >
        View Task
        <ArrowRight size={13} />
      </button>
    </div>
  );
}

// ─── Section block ────────────────────────────────────────────────────────────

interface SectionBlockProps {
  section: UrgencySection;
  tasks: Task[];
  onNavigateToTasks: () => void;
}

function SectionBlock({ section, tasks, onNavigateToTasks }: SectionBlockProps) {
  if (tasks.length === 0) return null;
  const Icon = section.icon;

  return (
    <div className="space-y-3">
      {/* Section header */}
      <div
        className={`flex items-center justify-between px-4 py-2.5 rounded-xl border ${section.headerClass}`}
      >
        <div className="flex items-center gap-2">
          <Icon size={16} className={section.iconClass} />
          <span className={`text-sm font-semibold ${section.iconClass}`}>{section.label}</span>
          <span
            className={`text-[11px] px-2 py-0.5 rounded-full border font-mono font-bold ${section.badgeClass}`}
          >
            {tasks.length}
          </span>
        </div>
        <p className="hidden sm:block text-[11px] text-slate-400">{section.description}</p>
      </div>

      {/* Rows */}
      <div className="space-y-2 pl-1">
        {tasks.map((task) => (
          <AlertRow
            key={task.id}
            task={task}
            section={section}
            onNavigateToTasks={onNavigateToTasks}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export const AlertInbox: React.FC<AlertInboxProps> = ({ tasks, onNavigateToTasks }) => {
  // Keep only non-completed, non-none urgency tasks
  const alertTasks = tasks.filter(
    (t) => t.urgency !== 'none' && t.status !== 'completed'
  );

  const byUrgency = (key: TaskUrgency) =>
    alertTasks.filter((t) => t.urgency === key);

  const overdueList   = byUrgency('overdue');
  const dueTodayList  = byUrgency('due_today');
  const upcomingList  = byUrgency('upcoming');

  const totalAlerts = alertTasks.length;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
            <Bell size={20} className="text-rose-400" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-white tracking-tight">
              Alert Inbox
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Tasks requiring your attention — sorted by urgency
            </p>
          </div>
        </div>

        {totalAlerts > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold self-start sm:self-auto">
            <AlertTriangle size={14} />
            {totalAlerts} active alert{totalAlerts !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Note: frontend-only mock */}
      <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-400">
        <Info size={14} className="text-slate-500 shrink-0 mt-0.5" />
        <span>
          Urgency is currently derived from mock task data.{' '}
          <span className="text-slate-500">
            Real-time backend alert detection will be enabled once task CRUD endpoints are live.
          </span>
        </span>
      </div>

      {/* Empty state */}
      {totalAlerts === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle2 size={32} className="text-emerald-400" />
          </div>
          <h3 className="text-base font-semibold text-white">All clear!</h3>
          <p className="text-sm text-slate-400 max-w-xs">
            No overdue or upcoming tasks right now. Keep up the great work.
          </p>
        </div>
      )}

      {/* Urgency groups */}
      {totalAlerts > 0 && (
        <div className="space-y-8">
          {URGENCY_SECTIONS.map((section) => (
            <SectionBlock
              key={section.key}
              section={section}
              tasks={
                section.key === 'overdue'
                  ? overdueList
                  : section.key === 'due_today'
                  ? dueTodayList
                  : upcomingList
              }
              onNavigateToTasks={onNavigateToTasks}
            />
          ))}
        </div>
      )}

      {/* Footer CTA */}
      {totalAlerts > 0 && (
        <div className="flex justify-end pt-2">
          <button
            onClick={onNavigateToTasks}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold shadow-sm transition active:scale-95"
          >
            Open My Tasks
            <ArrowRight size={14} strokeWidth={2.5} />
          </button>
        </div>
      )}
    </div>
  );
};
