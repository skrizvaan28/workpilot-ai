import React, { useState } from 'react';
import { Settings, Shield, Sparkles, Bell, CheckCircle2 } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const [autonomyLevel, setAutonomyLevel] = useState<'copilot' | 'autonomous' | 'manual'>('copilot');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <Settings size={20} className="text-amber-400" />
          <h2 className="text-xl font-display font-bold text-white">
            Workspace & AI Engine Settings
          </h2>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure AI intelligence behavior, notifications, and productivity parameters
        </p>
      </div>

      {saved && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>Preferences updated successfully.</span>
        </div>
      )}

      {/* AI Autonomy Mode */}
      <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-amber-400" />
          <h3 className="font-semibold text-white text-sm">
            AI Task Optimization & Autonomy Mode
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div
            onClick={() => setAutonomyLevel('copilot')}
            className={`p-3.5 rounded-xl border cursor-pointer transition ${
              autonomyLevel === 'copilot'
                ? 'bg-amber-500/10 border-amber-500/50 text-amber-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="font-bold text-xs text-white mb-1">Copilot (Recommended)</div>
            <p className="text-[11px] leading-relaxed">
              AI suggests task priorities and flags deadlines; requires one-click approval.
            </p>
          </div>

          <div
            onClick={() => setAutonomyLevel('autonomous')}
            className={`p-3.5 rounded-xl border cursor-pointer transition ${
              autonomyLevel === 'autonomous'
                ? 'bg-amber-500/10 border-amber-500/50 text-amber-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="font-bold text-xs text-white mb-1">Autonomous Pilot</div>
            <p className="text-[11px] leading-relaxed">
              AI automatically re-ranks tasks and schedules focus blocks in real-time.
            </p>
          </div>

          <div
            onClick={() => setAutonomyLevel('manual')}
            className={`p-3.5 rounded-xl border cursor-pointer transition ${
              autonomyLevel === 'manual'
                ? 'bg-amber-500/10 border-amber-500/50 text-amber-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="font-bold text-xs text-white mb-1">Manual Mode</div>
            <p className="text-[11px] leading-relaxed">
              Standard task list without algorithmic re-ordering or neural suggestions.
            </p>
          </div>
        </div>
      </div>

      {/* Notifications and Safety */}
      <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-blue-400" />
          <h3 className="font-semibold text-white text-sm">
            Proactive Productivity Alerts
          </h3>
        </div>

        <div className="space-y-2.5 text-xs text-slate-300">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              defaultChecked
              className="h-4 w-4 rounded text-amber-500 bg-slate-950 border-slate-800"
            />
            <span>Alert me when 2 or more tasks approach overdue threshold (&lt; 4 hours)</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              defaultChecked
              className="h-4 w-4 rounded text-amber-500 bg-slate-950 border-slate-800"
            />
            <span>Notify when an uploaded document has finished task decomposition</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              defaultChecked
              className="h-4 w-4 rounded text-amber-500 bg-slate-950 border-slate-800"
            />
            <span>Deliver weekly productivity scorecard digest</span>
          </label>
        </div>
      </div>

      <button
        onClick={handleSave}
        className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm transition"
      >
        Save Changes
      </button>
    </div>
  );
};
