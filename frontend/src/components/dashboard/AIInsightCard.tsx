import React, { useState } from 'react';
import {
  Sparkles,
  AlertTriangle,
  ArrowRight,
  Target,
  TrendingUp,
  RefreshCw,
  CheckCircle2,
  Cpu,
} from 'lucide-react';
import { AIInsight } from '../../types/dashboard';

interface AIInsightCardProps {
  insights: AIInsight[];
  onActionClick?: (insight: AIInsight) => void;
}

export const AIInsightCard: React.FC<AIInsightCardProps> = ({
  insights,
  onActionClick,
}) => {
  const [recalculating, setRecalculating] = useState(false);
  const [activeNotification, setActiveNotification] = useState<string | null>(null);

  const handleRecalculate = () => {
    setRecalculating(true);
    setTimeout(() => {
      setRecalculating(false);
      setActiveNotification('AI updated task priorities based on latest calendar and velocity signals.');
      setTimeout(() => setActiveNotification(null), 4000);
    }, 900);
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
    <div className="relative rounded-xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-5 shadow-sm space-y-4">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Cpu size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-white text-base">
                AI Executive Insights & Recommendations
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/25 font-mono">
                Active Inference
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Continuous neural synthesis of task load, calendar friction, and historical delivery velocity
            </p>
          </div>
        </div>

        <button
          onClick={handleRecalculate}
          disabled={recalculating}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-300 hover:text-white transition disabled:opacity-50"
        >
          <RefreshCw size={13} className={recalculating ? 'animate-spin text-amber-400' : ''} />
          <span>{recalculating ? 'Synthesizing...' : 'Refresh Insights'}</span>
        </button>
      </div>

      {/* Notification toast if updated */}
      {activeNotification && (
        <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 size={15} />
          <span>{activeNotification}</span>
        </div>
      )}

      {/* 3 Insight Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className="flex flex-col justify-between p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition group"
          >
            <div>
              {/* Header badge & icon */}
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

              {/* Title & Description */}
              <h4 className="text-sm font-semibold text-white leading-snug group-hover:text-amber-300 transition-colors">
                {insight.headline}
              </h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                {insight.description}
              </p>
            </div>

            {/* Bottom impact & action */}
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
  );
};
