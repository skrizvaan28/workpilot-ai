import React from 'react';
import { BarChart3, TrendingUp, Zap, Clock, ShieldCheck, Award } from 'lucide-react';
import { ProductivityOverview } from './ProductivityOverview';
import { mockWeeklyProductivity } from '../../data/mockDashboardData';

export const AnalyticsView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <BarChart3 size={20} className="text-amber-400" />
          <h2 className="text-xl font-display font-bold text-white">
            Workspace Velocity & Productivity Analytics
          </h2>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          Comprehensive telemetry on focus hours, completion speed, and AI-assisted throughput
        </p>
      </div>

      <ProductivityOverview data={mockWeeklyProductivity} />

      {/* Deep-dive KPI breakdown cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <Clock size={15} className="text-blue-400" />
            <span>Average Task Turnaround</span>
          </div>
          <div className="text-2xl font-display font-bold text-white">2.4 Hours</div>
          <p className="text-xs text-emerald-400 flex items-center gap-1">
            <TrendingUp size={12} /> 22% faster than last sprint
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <Zap size={15} className="text-amber-400" />
            <span>Cumulative AI Time Reclaimed</span>
          </div>
          <div className="text-2xl font-display font-bold text-white">48.2 Hours</div>
          <p className="text-xs text-slate-400">
            Automated PRD extraction & task prioritization
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <Award size={15} className="text-purple-400" />
            <span>Delivery Reliability Index</span>
          </div>
          <div className="text-2xl font-display font-bold text-white">96.8%</div>
          <p className="text-xs text-emerald-400">
            Top 2% among enterprise teams
          </p>
        </div>
      </div>
    </div>
  );
};
