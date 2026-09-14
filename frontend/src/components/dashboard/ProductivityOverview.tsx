import React, { useState } from 'react';
import {
  TrendingUp,
  BarChart2,
  Clock,
  Zap,
  Target,
  Sparkles,
  Calendar,
} from 'lucide-react';
import { DailyProductivity } from '../../types/dashboard';

interface ProductivityOverviewProps {
  data: DailyProductivity[];
}

export const ProductivityOverview: React.FC<ProductivityOverviewProps> = ({ data }) => {
  const [activeDayIndex, setActiveDayIndex] = useState<number>(2); // Default to Wed (highest)

  const activeDay = data[activeDayIndex] || data[0];

  // SVG Chart Dimensions
  const svgWidth = 500;
  const svgHeight = 160;
  const paddingX = 35;
  const paddingY = 25;
  const graphWidth = svgWidth - paddingX * 2;
  const graphHeight = svgHeight - paddingY * 2;

  // Calculate coordinates for the line/area chart
  const points = data.map((d, index) => {
    const x = paddingX + (index / (data.length - 1)) * graphWidth;
    const y = paddingY + graphHeight - ((d.score - 50) / 50) * graphHeight;
    return { x, y, score: d.score, day: d.day };
  });

  const pathD = points.reduce((acc, point, i) => {
    return i === 0 ? `M ${point.x},${point.y}` : `${acc} L ${point.x},${point.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x},${svgHeight - paddingY} L ${points[0].x},${svgHeight - paddingY} Z`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* 1. Weekly Productivity Chart (2 columns) */}
      <div className="lg:col-span-2 rounded-xl bg-slate-900/80 border border-slate-800 p-5 flex flex-col justify-between shadow-sm">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <BarChart2 size={18} className="text-amber-400" />
                <h3 className="font-display font-semibold text-white text-base">
                  Weekly Productivity Velocity
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Daily output score calculated by task complexity, completion time, and AI assist efficiency
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Calendar size={13} /> Current Week
              </span>
              <div className="text-xs px-2 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                Avg: 82%
              </div>
            </div>
          </div>

          {/* Interactive SVG Line Graph */}
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-44 select-none overflow-visible"
            >
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const yPos = paddingY + graphHeight * ratio;
                return (
                  <line
                    key={i}
                    x1={paddingX}
                    y1={yPos}
                    x2={svgWidth - paddingX}
                    y2={yPos}
                    stroke="#334155"
                    strokeDasharray="4 4"
                    strokeWidth="0.8"
                    opacity="0.5"
                  />
                );
              })}

              {/* Gradient Area under curve */}
              <path d={areaD} fill="url(#areaGradient)" />

              {/* Main Curve Line */}
              <path
                d={pathD}
                fill="none"
                stroke="url(#lineGradient)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data points */}
              {points.map((pt, i) => {
                const isSelected = activeDayIndex === i;
                return (
                  <g
                    key={pt.day}
                    className="cursor-pointer group"
                    onClick={() => setActiveDayIndex(i)}
                  >
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isSelected ? 6 : 4}
                      fill={isSelected ? '#f59e0b' : '#0f172a'}
                      stroke={isSelected ? '#ffffff' : '#f59e0b'}
                      strokeWidth="2.5"
                      className="transition-all duration-200 group-hover:scale-125"
                    />

                    {/* Day label on X axis */}
                    <text
                      x={pt.x}
                      y={svgHeight - 4}
                      textAnchor="middle"
                      fill={isSelected ? '#f8fafc' : '#94a3b8'}
                      fontSize="11"
                      fontWeight={isSelected ? '600' : '400'}
                    >
                      {pt.day}
                    </text>

                    {/* Selected badge floating above point */}
                    {isSelected && (
                      <g transform={`translate(${pt.x}, ${pt.y - 14})`}>
                        <rect
                          x="-20"
                          y="-16"
                          width="40"
                          height="18"
                          rx="4"
                          fill="#1e293b"
                          stroke="#f59e0b"
                          strokeWidth="1"
                        />
                        <text
                          x="0"
                          y="-4"
                          textAnchor="middle"
                          fill="#f8fafc"
                          fontSize="10"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          {pt.score}%
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Dynamic breakdown bar for the selected day */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-200">
              {activeDay.day}'s Metrics:
            </span>
            <span className="text-slate-400">
              Tasks: <strong className="text-white font-mono">{activeDay.completedTasks}</strong> / {activeDay.plannedTasks} completed
            </span>
            <span className="text-slate-400">
              Focus Time: <strong className="text-emerald-400 font-mono">{activeDay.focusHours} hrs</strong>
            </span>
          </div>
          <span className="text-slate-400 text-[11px] italic">
            Click any point to inspect day details
          </span>
        </div>
      </div>

      {/* 2. Tasks Completed vs Planned Bar Chart & Focus Stats (1 column) */}
      <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 flex flex-col justify-between shadow-sm">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-semibold text-white text-base flex items-center gap-2">
              <Target size={17} className="text-emerald-400" />
              Daily Task Delivery
            </h3>
            <span className="text-[11px] text-slate-400">Completed vs Planned</span>
          </div>

          {/* Vertical Comparison Bars */}
          <div className="space-y-2.5 my-3">
            {data.slice(0, 5).map((d) => {
              const ratio = Math.min((d.completedTasks / Math.max(d.plannedTasks, 1)) * 100, 100);
              return (
                <div key={d.day} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium w-8">{d.day}</span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {d.completedTasks}/{d.plannedTasks} tasks
                    </span>
                  </div>
                  <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden flex">
                    <div
                      className="bg-emerald-400 h-full rounded-full transition-all duration-300"
                      style={{ width: `${ratio}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Focus & Productivity Key Metrics */}
        <div className="pt-3 border-t border-slate-800 grid grid-cols-2 gap-3 text-xs">
          <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
              <Clock size={13} className="text-blue-400" />
              <span>Deep Focus Time</span>
            </div>
            <div className="text-base font-display font-bold text-white">5h 42m</div>
            <span className="text-[10px] text-emerald-400 flex items-center mt-0.5">
              <TrendingUp size={10} className="mr-0.5" /> +45m vs avg
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
              <Zap size={13} className="text-amber-400" />
              <span>AI Time Saved</span>
            </div>
            <div className="text-base font-display font-bold text-white">+14.5 hrs</div>
            <span className="text-[10px] text-slate-400 flex items-center mt-0.5">
              <Sparkles size={10} className="mr-0.5 text-amber-400" /> Document parsing
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
