import React, { useState } from 'react';
import {
  CheckSquare,
  Sparkles,
  Clock,
  Plus,
  ArrowUpDown,
  CheckCircle2,
  AlertCircle,
  Tag,
} from 'lucide-react';
import { Task, TaskPriority, TaskStatus } from '../../types/dashboard';

interface MyTasksTableProps {
  tasks: Task[];
  onToggleTask: (taskId: string) => void;
  onOpenCreateTask: () => void;
  searchFilter?: string;
}

export const MyTasksTable: React.FC<MyTasksTableProps> = ({
  tasks,
  onToggleTask,
  onOpenCreateTask,
  searchFilter = '',
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'in_progress' | 'high_priority' | 'completed'>('all');
  const [sortBy, setSortBy] = useState<'ai_score' | 'due_date'>('ai_score');

  // Filter tasks based on search & tab
  const filteredTasks = tasks.filter((task) => {
    // Search query filter
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchCategory = task.category.toLowerCase().includes(q);
      const matchReason = task.aiReasoning.toLowerCase().includes(q);
      if (!matchTitle && !matchCategory && !matchReason) return false;
    }

    // Tab filter
    if (filterTab === 'in_progress') {
      return task.status === 'in_progress' || task.status === 'pending';
    }
    if (filterTab === 'high_priority') {
      return task.priority === 'high';
    }
    if (filterTab === 'completed') {
      return task.status === 'completed';
    }
    return true;
  });

  // Sort
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'ai_score') {
      return b.aiPriorityScore - a.aiPriorityScore;
    }
    return a.dueDate.localeCompare(b.dueDate);
  });

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'high':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            High
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Medium
          </span>
        );
      case 'low':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            Low
          </span>
        );
    }
  };

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 size={11} /> Done
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" /> In Progress
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
            <Clock size={11} /> Pending
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle size={11} /> Overdue
          </span>
        );
    }
  };

  return (
    <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 shadow-sm space-y-4">
      {/* Table Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <CheckSquare size={19} className="text-amber-400" />
            <h2 className="font-display font-bold text-white text-lg">My Tasks</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {tasks.length}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Tasks dynamically prioritized by WorkPilot AI based on deadlines, cross-team blockers, and impact
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Filter Pills */}
          <div className="flex items-center p-1 rounded-lg bg-slate-950 border border-slate-800 text-xs">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                filterTab === 'all'
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({tasks.length})
            </button>
            <button
              onClick={() => setFilterTab('in_progress')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                filterTab === 'in_progress'
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilterTab('high_priority')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                filterTab === 'high_priority'
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              High Priority
            </button>
            <button
              onClick={() => setFilterTab('completed')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                filterTab === 'completed'
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Done
            </button>
          </div>

          <button
            onClick={() =>
              setSortBy((prev) => (prev === 'ai_score' ? 'due_date' : 'ai_score'))
            }
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-950/80 text-xs text-slate-300 hover:text-white transition"
            title="Toggle sort"
          >
            <ArrowUpDown size={13} />
            <span className="hidden sm:inline">
              {sortBy === 'ai_score' ? 'AI Rank' : 'Due Date'}
            </span>
          </button>

          <button
            onClick={onOpenCreateTask}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold shadow-sm transition active:scale-95"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* Task List / Table View */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
              <th className="py-2.5 px-3 font-semibold">Task</th>
              <th className="py-2.5 px-3 font-semibold">Priority</th>
              <th className="py-2.5 px-3 font-semibold">Status</th>
              <th className="py-2.5 px-3 font-semibold">Due Date</th>
              <th className="py-2.5 px-3 font-semibold w-32">Progress</th>
              <th className="py-2.5 px-3 font-semibold">AI Priority Indicator</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {sortedTasks.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                  No tasks found matching your filter.
                </td>
              </tr>
            ) : (
              sortedTasks.map((task) => {
                const isCompleted = task.status === 'completed';

                return (
                  <tr
                    key={task.id}
                    className={`group hover:bg-slate-800/40 transition-colors ${
                      isCompleted ? 'opacity-60 bg-slate-950/20' : ''
                    }`}
                  >
                    {/* Task Title & Checkbox */}
                    <td className="py-3 px-3">
                      <div className="flex items-start gap-2.5">
                        <button
                          onClick={() => onToggleTask(task.id)}
                          className={`mt-0.5 h-4 w-4 rounded flex items-center justify-center transition border ${
                            isCompleted
                              ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                              : 'border-slate-700 bg-slate-900 group-hover:border-amber-500'
                          }`}
                        >
                          {isCompleted && <CheckCircle2 size={13} className="text-slate-950" />}
                        </button>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-slate-400">
                              {task.id}
                            </span>
                            <span
                              className={`font-medium text-slate-100 ${
                                isCompleted ? 'line-through text-slate-400' : ''
                              }`}
                            >
                              {task.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                              <Tag size={10} /> {task.category}
                            </span>
                            {task.assignee && (
                              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                • {task.assignee.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {getPriorityBadge(task.priority)}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {getStatusBadge(task.status)}
                    </td>

                    {/* Due Date */}
                    <td className="py-3 px-3 whitespace-nowrap text-xs text-slate-300 font-mono">
                      {task.dueDate}
                    </td>

                    {/* Progress Bar */}
                    <td className="py-3 px-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-slate-400">{task.progress}%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isCompleted
                                ? 'bg-emerald-400'
                                : task.progress > 70
                                ? 'bg-amber-400'
                                : 'bg-blue-400'
                            }`}
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* AI Priority Indicator */}
                    <td className="py-3 px-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Sparkles size={10} />
                            Score: {task.aiPriorityScore}/100
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 max-w-xs truncate" title={task.aiReasoning}>
                          {task.aiReasoning}
                        </p>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
