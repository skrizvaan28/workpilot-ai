import React, { useState } from 'react';
import { X, Sparkles, Plus, CheckSquare } from 'lucide-react';
import { Task, TaskPriority } from '../../types/dashboard';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (newTask: Omit<Task, 'id'>) => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  onAddTask,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Product Engineering');
  const [priority, setPriority] = useState<TaskPriority>('high');
  const [dueDate, setDueDate] = useState('Today, 5:00 PM');
  const [aiPrioritize, setAiPrioritize] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Simulate AI score calculation
    const calculatedAiScore = aiPrioritize
      ? priority === 'high'
        ? 92 + Math.floor(Math.random() * 7)
        : priority === 'medium'
        ? 75 + Math.floor(Math.random() * 10)
        : 60 + Math.floor(Math.random() * 10)
      : 70;

    const aiReason = aiPrioritize
      ? `AI evaluated task against current sprint milestones: ranked as ${priority} priority.`
      : 'Manual priority assignment by user.';

    onAddTask({
      title: title.trim(),
      category,
      priority,
      status: 'in_progress',
      dueDate,
      progress: 0,
      aiPriorityScore: calculatedAiScore,
      aiReasoning: aiReason,
      assignee: {
        name: 'Rizvaan S.',
        avatar: 'RS',
      },
    });

    setTitle('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden text-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <CheckSquare size={18} />
            </div>
            <h3 className="font-display font-bold text-white text-base">
              Create New Task
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Task Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Benchmark database queries for latency optimization"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500 transition"
              >
                <option value="Product Engineering">Product Engineering</option>
                <option value="AI / RAG Pipeline">AI / RAG Pipeline</option>
                <option value="Security & Compliance">Security & Compliance</option>
                <option value="DevOps & Cloud">DevOps & Cloud</option>
                <option value="Product Design">Product Design</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Initial Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500 transition"
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Due Date / Target
            </label>
            <input
              type="text"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              placeholder="e.g. Today, 5:00 PM or Sep 18, 2026"
              className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          {/* AI Auto Prioritization Switch */}
          <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-3">
            <input
              type="checkbox"
              id="ai-prioritize-toggle"
              checked={aiPrioritize}
              onChange={(e) => setAiPrioritize(e.target.checked)}
              className="mt-1 h-4 w-4 rounded text-amber-500 border-slate-700 bg-slate-950 focus:ring-amber-500"
            />
            <label htmlFor="ai-prioritize-toggle" className="text-xs text-slate-300 cursor-pointer">
              <div className="font-semibold text-amber-400 flex items-center gap-1.5">
                <Sparkles size={13} />
                Enable WorkPilot AI Prioritization
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                WorkPilot AI will automatically score this task, detect cross-functional blockers, and suggest the optimal focus window.
              </p>
            </label>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-800 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-sm transition active:scale-95"
            >
              <Plus size={15} strokeWidth={2.5} />
              <span>Create Task</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
