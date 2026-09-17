import { useEffect, useState } from "react";
import { Award, Flame, LoaderCircle, Sparkles, Target, Trophy } from "lucide-react";
import { api, RewardsOverview } from "../../lib/api";

interface ProductivityRewardsProps {
  refreshKey: number;
}

const milestones = [
  { label: "First Task", target: 1, field: "total_completed_tasks" as const },
  { label: "5 Tasks Completed", target: 5, field: "total_completed_tasks" as const },
  { label: "10 Tasks Completed", target: 10, field: "total_completed_tasks" as const },
  { label: "7 Day Streak", target: 7, field: "longest_streak" as const },
];

export function ProductivityRewards({ refreshKey }: ProductivityRewardsProps) {
  const [overview, setOverview] = useState<RewardsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadRewards() {
    setLoading(true);
    setError("");
    try {
      setOverview(await api.rewardsOverview());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load productivity rewards.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRewards();
  }, [refreshKey]);

  const nextMilestone = overview
    ? milestones.find((milestone) => !overview.unlocked_badges.includes(milestone.label))
    : milestones[0];
  const progressValue = overview && nextMilestone
    ? Math.min(overview[nextMilestone.field] / nextMilestone.target, 1)
    : 0;

  return (
    <section className="overflow-hidden rounded-xl border border-amber-500/25 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.14),transparent_36%),#0f172a] shadow-sm">
      <div className="border-b border-amber-500/15 px-4 py-4 sm:px-5">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-amber-400/10 p-2 text-amber-300"><Trophy size={18} /></div>
          <div><p className="text-xs uppercase tracking-[0.18em] text-amber-400">Momentum system</p><h2 className="mt-1 font-display text-lg font-semibold text-white">Productivity Rewards</h2><p className="mt-1 text-xs text-slate-400">Small wins compound into a stronger work rhythm.</p></div>
        </div>
      </div>
      <div className="p-4 sm:p-5">
        {loading && <div className="flex items-center gap-2 py-5 text-sm text-slate-400"><LoaderCircle size={16} className="animate-spin text-amber-300" /> Calculating your momentum...</div>}
        {error && <div className="flex items-center justify-between gap-3 rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2.5 text-xs text-rose-300"><span>{error}</span><button onClick={() => void loadRewards()} className="font-semibold underline">Retry</button></div>}
        {!loading && !error && overview && <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.06] p-3"><div className="flex items-center justify-between text-xs text-slate-400"><span>Points</span><Sparkles size={14} className="text-amber-300" /></div><p className="mt-2 font-display text-2xl font-semibold text-amber-300">{overview.total_points}</p></div>
            <div className="rounded-lg border border-orange-500/20 bg-orange-500/[0.06] p-3"><div className="flex items-center justify-between text-xs text-slate-400"><span>Current streak</span><Flame size={14} className="text-orange-300" /></div><p className="mt-2 font-display text-2xl font-semibold text-orange-300">{overview.current_streak}<span className="ml-1 text-xs font-normal text-slate-500">days</span></p></div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3"><div className="flex items-center justify-between text-xs text-slate-400"><span>Longest streak</span><Target size={14} className="text-cyan-300" /></div><p className="mt-2 font-display text-2xl font-semibold text-white">{overview.longest_streak}<span className="ml-1 text-xs font-normal text-slate-500">days</span></p></div>
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] p-3"><div className="flex items-center justify-between text-xs text-slate-400"><span>Completed today</span><Award size={14} className="text-emerald-300" /></div><p className="mt-2 font-display text-2xl font-semibold text-emerald-300">{overview.tasks_completed_today}</p></div>
          </div>
          <div className="mt-5 rounded-lg border border-slate-800 bg-slate-950/40 p-4">
            <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold text-white">{nextMilestone ? `Next milestone: ${nextMilestone.label}` : "All milestones unlocked"}</p><p className="mt-1 text-[11px] text-slate-500">{nextMilestone ? `${overview[nextMilestone.field]} of ${nextMilestone.target} toward this badge` : "Keep the momentum going."}</p></div>{nextMilestone && <span className="text-xs font-semibold text-amber-300">{Math.round(progressValue * 100)}%</span>}</div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400 transition-all" style={{ width: `${progressValue * 100}%` }} /></div>
          </div>
          <div className="mt-5"><p className="text-xs font-semibold text-slate-300">Unlocked badges</p>{overview.unlocked_badges.length === 0 ? <p className="mt-2 text-xs text-slate-500">Complete your first task to unlock a badge.</p> : <div className="mt-2 flex flex-wrap gap-2">{overview.unlocked_badges.map((badge) => <span key={badge} className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-400/10 px-2.5 py-1 text-xs text-amber-200"><Award size={12} />{badge}</span>)}</div>}</div>
        </>}
      </div>
    </section>
  );
}