import React from 'react';
import { Users, Shield, Zap, CheckCircle2, UserPlus } from 'lucide-react';
import { mockTeamMembers } from '../../data/mockDashboardData';

export const TeamView: React.FC = () => {
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <Users size={20} className="text-amber-400" />
            <h2 className="text-xl font-display font-bold text-white">
              Team Workload & Collaboration
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor member capacity, AI assist usage, and cross-functional task throughput
          </p>
        </div>

        <button className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition">
          <UserPlus size={15} />
          <span>Invite Member</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {mockTeamMembers.map((member) => (
          <div
            key={member.email}
            className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition space-y-3"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center font-bold text-slate-950 text-sm shadow-md">
                {member.avatar}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">{member.name}</h4>
                <p className="text-[11px] text-slate-400">{member.role}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Current Focus:</span>
                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono text-[10px] border border-amber-500/20">
                  {member.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Active Tasks:</span>
                <span className="text-white font-mono font-semibold">{member.activeTasks} in queue</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Productivity:</span>
                <span className="text-emerald-400 font-mono font-semibold">{member.productivity}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
