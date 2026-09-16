import React from "react";
import {
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Info,
  CheckCircle2,
  Clock,
  ArrowRight,
  Zap,
  Gauge,
} from "lucide-react";
import { TaskInsight } from "../../types/dashboard";

interface AITaskInsightCardProps {
  insight: TaskInsight | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  compact?: boolean;
  taskTitle?: string;
  fallbackReason?: string;
}

const levelStyles = {
  HIGH: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  MEDIUM: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  LOW: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
} as const;

export const AITaskInsightCard: React.FC<AITaskInsightCardProps> = ({
  insight,
  loading,
  error,
  onRetry,
  compact = false,
  taskTitle,
  fallbackReason,
}) => {
  if (loading) {
    return (
      <div
        className={`rounded-xl border border-slate-800 bg-slate-950/70 ${
          compact ? "p-3" : "p-5"
        } flex items-center justify-between gap-3 text-xs text-slate-300`}
      >
        <div className="flex items-center gap-2.5">
          <RefreshCw size={15} className="animate-spin text-amber-400 shrink-0" />
          <span>Analyzing task dynamics with AI Insight Engine…</span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
          Inferencing
        </span>
      </div>
    );
  }

  if (error || !insight) {
    return (
      <div
        className={`rounded-xl border border-slate-800 bg-slate-950/70 space-y-3 ${
          compact ? "p-3" : "p-5"
        }`}
      >
        <div className="flex items-start gap-2 text-xs text-slate-300">
          <Info size={15} className="text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-medium text-slate-200">
              {error || "AI insight temporarily unavailable."}
            </span>
            {fallbackReason && (
              <p className="text-[11px] text-slate-400">{fallbackReason}</p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-slate-700 bg-slate-900 text-xs font-medium text-slate-200 hover:text-amber-300 hover:border-amber-500/40 transition"
        >
          <RefreshCw size={12} />
          Retry Analysis
        </button>
      </div>
    );
  }

  // Derive display values
  const priority = insight.priority || (insight.suggested_priority?.toUpperCase() as "HIGH" | "MEDIUM" | "LOW") || "MEDIUM";
  const deadlineRisk = insight.deadline_risk || (insight.risk_level?.toUpperCase() as "HIGH" | "MEDIUM" | "LOW") || "MEDIUM";
  const urgency = insight.urgency || deadlineRisk;
  const effort = insight.estimated_effort || "Medium";
  const completionStatus = insight.completion_status || "In Progress";
  const recommendedAction = insight.recommended_action || insight.reason;
  const explanation = insight.explanation || insight.insight || insight.reason;

  return (
    <div
      className={`rounded-xl border border-slate-800/90 bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 shadow-md ${
        compact ? "p-3.5 space-y-3" : "p-5 space-y-4"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-slate-800/70">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm">
            <Sparkles size={14} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-display font-bold text-white text-sm">
                AI Task Insight Engine
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Live Assessment
              </span>
            </div>
            {taskTitle && (
              <p className="text-[11px] text-slate-400 truncate max-w-sm">
                Task: <span className="text-slate-200 font-medium">{taskTitle}</span>
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-800 bg-slate-950/80 hover:bg-slate-800 text-[11px] font-medium text-slate-300 hover:text-amber-300 transition"
          title="Re-run AI Task Analysis"
        >
          <RefreshCw size={11} />
          <span>Re-analyze</span>
        </button>
      </div>

      {/* 4 Core Insight Metric Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* 1. Task Priority */}
        <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1">
            <Zap size={11} className="text-amber-400" />
            Priority
          </span>
          <div className="mt-1">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold tracking-wide border ${
                levelStyles[priority] || levelStyles.MEDIUM
              }`}
            >
              {priority}
            </span>
          </div>
        </div>

        {/* 2. Deadline Risk */}
        <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1">
            <AlertTriangle size={11} className="text-rose-400" />
            Deadline Risk
          </span>
          <div className="mt-1">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold tracking-wide border ${
                levelStyles[deadlineRisk] || levelStyles.MEDIUM
              }`}
            >
              {deadlineRisk}
            </span>
          </div>
        </div>

        {/* 3. Task Urgency */}
        <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1">
            <Clock size={11} className="text-blue-400" />
            Urgency
          </span>
          <div className="mt-1">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold tracking-wide border ${
                levelStyles[urgency] || levelStyles.MEDIUM
              }`}
            >
              {urgency}
            </span>
          </div>
        </div>

        {/* 4. Estimated Effort */}
        <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1">
            <Gauge size={11} className="text-purple-400" />
            Estimated Effort
          </span>
          <div className="mt-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold text-slate-200 bg-slate-800 border border-slate-700">
              {effort}
            </span>
          </div>
        </div>
      </div>

      {/* 5. Completion Status */}
      <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-950/60 border border-slate-800/70 text-xs">
        <span className="text-slate-400 font-medium">Completion Status:</span>
        <span className="inline-flex items-center gap-1.5 font-mono text-slate-200">
          <CheckCircle2 size={13} className="text-amber-400" />
          {completionStatus}
        </span>
      </div>

      {/* 6. Recommended Next Action */}
      <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 space-y-1">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-amber-400">
          <ArrowRight size={12} />
          <span>Recommended Action</span>
        </div>
        <p className="text-xs text-slate-200 leading-relaxed font-medium">
          {recommendedAction}
        </p>
      </div>

      {/* 7. Short Natural-Language AI Explanation */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          <Sparkles size={11} className="text-amber-400" />
          <span>AI Explanation</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed italic bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60">
          "{explanation}"
        </p>
      </div>
    </div>
  );
};
