import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BarChart3, CheckCircle2, Clock3, Flame, LoaderCircle, Sparkles, Target } from "lucide-react";
import { AnalyticsOverview, api } from "../../lib/api";

function SummaryCard({ label, value, detail, tone, icon: Icon }: { label: string; value: string; detail: string; tone: string; icon: typeof BarChart3 }) {
  return <div className="rounded-xl border border-slate-800 bg-slate-900/75 p-4 shadow-sm"><div className="flex items-center justify-between"><span className="text-xs text-slate-400">{label}</span><span className={`rounded-lg p-1.5 ${tone}`}><Icon size={16} /></span></div><p className="mt-3 font-display text-2xl font-semibold text-white">{value}</p><p className="mt-1 text-[11px] text-slate-500">{detail}</p></div>;
}

export function ReportsAnalytics() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadOverview() {
    setLoading(true);
    setError("");
    try {
      setOverview(await api.analyticsOverview());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load analytics.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadOverview();
  }, []);

  const maxDailyCompletions = useMemo(() => Math.max(...(overview?.weekly_productivity.map((point) => point.completed_tasks) ?? [0]), 1), [overview]);
  const maxPriorityCount = Math.max(overview?.high_priority_tasks ?? 0, overview?.medium_priority_tasks ?? 0, overview?.low_priority_tasks ?? 0, 1);

  return <section className="space-y-6">
    <div className="flex flex-col gap-2 border-b border-slate-800/80 pb-4"><div className="flex items-center gap-2"><BarChart3 size={20} className="text-amber-400" /><h1 className="font-display text-2xl font-bold text-white">Reports & Analytics</h1></div><p className="text-sm text-slate-400">A live view of delivery pace, task mix, and productivity momentum.</p></div>

    {loading && <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/70 py-16 text-sm text-slate-400"><LoaderCircle size={17} className="animate-spin text-amber-300" /> Calculating workspace analytics...</div>}
    {error && <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-300"><span>{error}</span><button onClick={() => void loadOverview()} className="font-semibold underline">Retry</button></div>}

    {!loading && !error && overview && <>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        <SummaryCard label="Total Tasks" value={`${overview.total_tasks}`} detail="All tasks in your queue" tone="bg-slate-800 text-slate-300" icon={BarChart3} />
        <SummaryCard label="Completed" value={`${overview.completed_tasks}`} detail="Delivered work" tone="bg-emerald-500/10 text-emerald-300" icon={CheckCircle2} />
        <SummaryCard label="Pending" value={`${overview.pending_tasks}`} detail="Still in motion" tone="bg-amber-500/10 text-amber-300" icon={Clock3} />
        <SummaryCard label="Overdue" value={`${overview.overdue_tasks}`} detail="Needs attention" tone="bg-rose-500/10 text-rose-300" icon={AlertTriangle} />
        <SummaryCard label="Completion Rate" value={`${overview.completion_rate}%`} detail="Completed versus total" tone="bg-cyan-500/10 text-cyan-300" icon={Target} />
      </div>

      {overview.total_tasks === 0 && <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/50 px-5 py-10 text-center"><BarChart3 size={30} className="mx-auto text-slate-600" /><h2 className="mt-3 font-display text-lg font-semibold text-slate-300">Your report is ready for its first signal</h2><p className="mx-auto mt-1 max-w-md text-sm text-slate-500">Create and complete tasks to turn this workspace into a useful productivity record.</p></div>}

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="rounded-xl border border-slate-800 bg-slate-900/75 p-4 shadow-sm sm:p-5"><div className="flex items-center justify-between"><div><h2 className="font-display text-lg font-semibold text-white">Weekly productivity</h2><p className="mt-1 text-xs text-slate-500">Completed tasks from Monday through Sunday</p></div><span className="rounded-lg bg-amber-500/10 p-2 text-amber-300"><Sparkles size={16} /></span></div><div className="mt-6 flex h-48 items-end gap-2 sm:gap-4">{overview.weekly_productivity.map((point) => <div key={point.date} className="flex min-w-0 flex-1 flex-col items-center gap-2"><span className="text-[11px] font-semibold text-slate-300">{point.completed_tasks || ""}</span><div className="flex h-32 w-full items-end rounded-t-md bg-slate-950/60"><div className="w-full rounded-t-md bg-gradient-to-t from-amber-600 to-amber-300 transition-all" style={{ height: `${(point.completed_tasks / maxDailyCompletions) * 100}%`, minHeight: point.completed_tasks ? "8px" : "0" }} /></div><span className="text-[10px] text-slate-500 sm:text-xs">{point.day.slice(0, 3)}</span></div>)}</div>{overview.tasks_completed_this_week === 0 && <p className="mt-4 text-center text-xs text-slate-600">No tasks completed this week yet.</p>}</div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/75 p-4 shadow-sm sm:p-5"><h2 className="font-display text-lg font-semibold text-white">Priority distribution</h2><p className="mt-1 text-xs text-slate-500">Task mix across your current queue</p><div className="mt-6 space-y-5">{([['High', overview.high_priority_tasks, 'bg-rose-400'], ['Medium', overview.medium_priority_tasks, 'bg-amber-400'], ['Low', overview.low_priority_tasks, 'bg-slate-400']] as const).map(([label, count, color]) => <div key={label}><div className="flex items-center justify-between text-xs"><span className="text-slate-400">{label}</span><span className="font-semibold text-white">{count}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800"><div className={`h-full rounded-full ${color}`} style={{ width: `${(count / maxPriorityCount) * 100}%` }} /></div></div>)}</div></div>
      </div>

      <div className="rounded-xl border border-amber-500/20 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.11),transparent_36%),#0f172a] p-4 shadow-sm sm:p-5"><div className="flex items-center gap-2"><Flame size={18} className="text-orange-300" /><h2 className="font-display text-lg font-semibold text-white">Productivity momentum</h2></div><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4"><div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3"><p className="text-xs text-slate-500">Current streak</p><p className="mt-2 font-display text-2xl font-semibold text-orange-300">{overview.current_streak}<span className="ml-1 text-xs font-normal text-slate-500">days</span></p></div><div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3"><p className="text-xs text-slate-500">Longest streak</p><p className="mt-2 font-display text-2xl font-semibold text-white">{overview.longest_streak}<span className="ml-1 text-xs font-normal text-slate-500">days</span></p></div><div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3"><p className="text-xs text-slate-500">Points</p><p className="mt-2 font-display text-2xl font-semibold text-amber-300">{overview.productivity_points}</p></div><div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3"><p className="text-xs text-slate-500">This week</p><p className="mt-2 font-display text-2xl font-semibold text-emerald-300">{overview.tasks_completed_this_week}</p></div></div></div>
    </>}
  </section>;
}