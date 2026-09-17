import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  Circle,
  ClipboardList,
  Clock3,
  Flag,
  Lightbulb,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { api, Task, TaskAnalysis } from "../../lib/api";
import { DocumentTaskExtractor } from "./DocumentTaskExtractor";
import { ProductivityRewards } from "./ProductivityRewards";

type Priority = Task["priority"];
type StatusFilter = "all" | "open" | "completed";

const priorityStyles: Record<Priority, string> = {
  high: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  medium: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  low: "border-slate-700 bg-slate-800/70 text-slate-300",
};

interface TaskFormProps {
  initial?: Task;
  onCancel: () => void;
  onSave: (value: { title: string; description: string; priority: Priority; due_date: string | null }) => Promise<void>;
}

function TaskForm({ initial, onCancel, onSave }: TaskFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [priority, setPriority] = useState<Priority>(initial?.priority ?? "medium");
  const [dueDate, setDueDate] = useState(initial?.due_date ?? "");
  const [validationError, setValidationError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) {
      setValidationError("Give this task a title before saving.");
      return;
    }
    if (title.trim().length < 3) {
      setValidationError("Task titles must be at least 3 characters.");
      return;
    }
    setValidationError("");
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        priority,
        due_date: dueDate || null,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-amber-500/25 bg-slate-950/80 p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-amber-400">Task details</p>
          <h3 className="mt-1 font-display text-lg font-semibold text-white">{initial ? "Edit task" : "New task"}</h3>
        </div>
        <button type="button" onClick={onCancel} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white" aria-label="Close task form">
          <X size={18} />
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="md:col-span-2 text-xs text-slate-400">
          Title
          <input autoFocus required maxLength={160} value={title} onChange={(event) => { setTitle(event.target.value); setValidationError(""); }} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400" placeholder="What needs to move forward?" />
          <span className="mt-1 block text-[11px] text-slate-600">{title.length}/160 characters</span>
        </label>
        <label className="md:col-span-2 text-xs text-slate-400">
          Description
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} className="mt-1.5 w-full resize-none rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400" placeholder="Add context or a next step" />
        </label>
        <label className="text-xs text-slate-400">
          Priority
          <select value={priority} onChange={(event) => setPriority(event.target.value as Priority)} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
        <label className="text-xs text-slate-400">
          Due date
          <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400" />
        </label>
      </div>
      {validationError && <p className="rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{validationError}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white">Cancel</button>
        <button disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-wait disabled:opacity-60">
          <Check size={15} /> {saving ? "Saving..." : initial ? "Save changes" : "Create task"}
        </button>
      </div>
    </form>
  );
}

export function TasksView() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [priority, setPriority] = useState<Priority | "all">("all");
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [analysis, setAnalysis] = useState<TaskAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [rewardsRefreshKey, setRewardsRefreshKey] = useState(0);
  const [completionMessage, setCompletionMessage] = useState("");

  async function loadTasks() {
    setLoading(true);
    setError("");
    try {
      setTasks(await api.tasks());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load tasks.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTasks();
  }, []);

  async function analyzeSelectedTask(taskId = selectedTaskId) {
    if (!taskId) return;
    setSelectedTaskId(taskId);
    setAnalysis(null);
    setAnalysisError("");
    setAnalysisLoading(true);
    try {
      setAnalysis(await api.analyzeTask(taskId));
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : "Unable to analyze this task.");
    } finally {
      setAnalysisLoading(false);
    }
  }

  const filteredTasks = useMemo(() => tasks.filter((task) => {
    const matchesQuery = `${task.title} ${task.description}`.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = status === "all" || (status === "completed" ? task.completed : !task.completed);
    const matchesPriority = priority === "all" || task.priority === priority;
    return matchesQuery && matchesStatus && matchesPriority;
  }), [priority, query, status, tasks]);

  async function saveTask(value: { title: string; description: string; priority: Priority; due_date: string | null }) {
    try {
      const saved = editingTask ? await api.updateTask(editingTask.id, value) : await api.createTask(value);
      setTasks((current) => editingTask ? current.map((task) => task.id === saved.id ? saved : task) : [saved, ...current]);
      setEditingTask(undefined);
      setIsCreating(false);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save task.");
      throw err;
    }
  }

  async function completeTask(task: Task) {
    try {
      const updated = await api.completeTask(task.id);
      setTasks((current) => current.map((item) => item.id === updated.id ? updated : item));
      setRewardsRefreshKey((current) => current + 1);
      setCompletionMessage(`Task completed. You earned ${task.priority === "high" ? 20 : task.priority === "medium" ? 15 : 10} points.`);
      window.setTimeout(() => setCompletionMessage(""), 3500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to complete task.");
    }
  }

  async function removeTask(taskId: string) {
    if (!window.confirm("Delete this task?")) return;
    try {
      await api.deleteTask(taskId);
      setTasks((current) => current.filter((task) => task.id !== taskId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete task.");
    }
  }

  const activeCount = tasks.filter((task) => !task.completed).length;
  const completedCount = tasks.length - activeCount;
  const highPriorityCount = tasks.filter((task) => task.priority === "high" && !task.completed).length;
  const dueSoonCount = tasks.filter((task) => {
    if (!task.due_date || task.completed) return false;
    const due = new Date(`${task.due_date}T23:59:59`);
    const today = new Date();
    const daysAway = (due.getTime() - today.getTime()) / 86400000;
    return daysAway >= 0 && daysAway <= 7;
  }).length;

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-amber-400">Execution layer</p>
          <h1 className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">My Tasks</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">A clear queue for the work that matters next, with priorities and deadlines in view.</p>
        </div>
        <button onClick={() => { setEditingTask(undefined); setIsCreating(true); }} className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-500/10 transition hover:bg-amber-400">
          <Plus size={17} /> Add task
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm"><div className="flex items-center justify-between"><p className="text-xs text-slate-500">Total tasks</p><ClipboardList size={16} className="text-slate-500" /></div><p className="mt-2 font-display text-2xl font-semibold text-white">{tasks.length}</p><p className="mt-1 text-[11px] text-slate-500">Across your queue</p></div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4 shadow-sm"><div className="flex items-center justify-between"><p className="text-xs text-slate-400">Completed</p><CheckCircle2 size={16} className="text-emerald-400" /></div><p className="mt-2 font-display text-2xl font-semibold text-emerald-300">{completedCount}</p><p className="mt-1 text-[11px] text-slate-500">Shipped and closed</p></div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-4 shadow-sm"><div className="flex items-center justify-between"><p className="text-xs text-slate-400">Pending</p><Clock3 size={16} className="text-amber-400" /></div><p className="mt-2 font-display text-2xl font-semibold text-amber-300">{activeCount}</p><p className="mt-1 text-[11px] text-slate-500">Still in motion</p></div>
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.06] p-4 shadow-sm"><div className="flex items-center justify-between"><p className="text-xs text-slate-400">High priority</p><Flag size={16} className="text-rose-400" /></div><p className="mt-2 font-display text-2xl font-semibold text-rose-300">{highPriorityCount}</p><p className="mt-1 text-[11px] text-slate-500">Needs focused attention</p></div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-gradient-to-r from-slate-900/90 to-slate-900/50 p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-sm font-semibold text-white">Task momentum</p><p className="mt-1 text-xs text-slate-500">A quick read on the work ahead.</p></div>
          <div className="flex items-center gap-5 text-xs"><div><span className="text-slate-500">Completion rate</span><p className="mt-1 font-display text-lg font-semibold text-white">{tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0}%</p></div><div className="h-8 w-px bg-slate-800" /><div><span className="text-slate-500">Due this week</span><p className="mt-1 font-display text-lg font-semibold text-amber-300">{dueSoonCount}</p></div><div className="hidden h-8 w-px bg-slate-800 sm:block" /><div className="hidden sm:block"><span className="text-slate-500">Focus queue</span><p className="mt-1 font-display text-lg font-semibold text-rose-300">{highPriorityCount}</p></div></div>
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all" style={{ width: `${tasks.length ? (completedCount / tasks.length) * 100 : 0}%` }} /></div>
      </div>

      <DocumentTaskExtractor onTasksCreated={loadTasks} />

      <ProductivityRewards refreshKey={rewardsRefreshKey} />

      {completionMessage && <div className="animate-[fade-in_250ms_ease-out] rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-300" role="status">{completionMessage}</div>}

      <section className="overflow-hidden rounded-xl border border-amber-500/25 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.12),transparent_38%),#0f172a] shadow-sm">
        <div className="border-b border-amber-500/15 px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-amber-400/10 p-2 text-amber-300"><Lightbulb size={18} /></div>
              <div><p className="text-xs uppercase tracking-[0.18em] text-amber-400">WorkPilot AI</p><h2 className="mt-1 font-display text-lg font-semibold text-white">AI Assistant</h2><p className="mt-1 text-xs text-slate-400">Turn task context into a practical execution plan.</p></div>
            </div>
            <div className="flex w-full gap-2 sm:w-auto">
              <select value={selectedTaskId} onChange={(event) => { setSelectedTaskId(event.target.value); setAnalysis(null); setAnalysisError(""); }} disabled={tasks.length === 0} className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-slate-300 outline-none focus:border-amber-400 sm:w-64 sm:flex-none"><option value="">{tasks.length ? "Select a task to analyze" : "No tasks available"}</option>{tasks.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}</select>
              <button onClick={() => void analyzeSelectedTask()} disabled={!selectedTaskId || analysisLoading} className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-amber-500 px-3 py-2.5 text-xs font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"><Lightbulb size={14} />{analysisLoading ? "Analyzing..." : "Analyze with AI"}</button>
            </div>
          </div>
        </div>
        <div className="p-4 sm:p-5">
          {analysisLoading && <div className="flex items-center gap-2 py-4 text-sm text-slate-400"><span className="h-4 w-4 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" /> Reviewing task context...</div>}
          {analysisError && <div className="flex items-center justify-between gap-3 rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2.5 text-xs text-rose-300"><span>{analysisError}</span><button onClick={() => void analyzeSelectedTask()} className="font-semibold text-rose-200 underline">Retry</button></div>}
          {!analysisLoading && !analysisError && !analysis && <div className="flex items-center gap-3 py-3 text-sm text-slate-500"><Lightbulb size={18} className="text-slate-600" /><span>Select an existing task to see a deterministic AI execution brief.</span></div>}
          {analysis && !analysisLoading && <div className="space-y-4">
            <div className="rounded-lg border border-amber-500/15 bg-slate-950/50 p-3.5"><p className="text-[11px] uppercase tracking-wider text-amber-400">Task summary</p><p className="mt-1.5 text-sm leading-relaxed text-slate-200">{analysis.summary}</p></div>
            <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3"><p className="text-[11px] text-slate-500">Suggested priority</p><p className={`mt-1 text-sm font-semibold capitalize ${analysis.suggested_priority === "high" ? "text-rose-300" : analysis.suggested_priority === "medium" ? "text-amber-300" : "text-slate-300"}`}>{analysis.suggested_priority}</p></div><div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3"><p className="text-[11px] text-slate-500">Estimated effort</p><p className="mt-1 text-sm font-semibold text-white">{analysis.estimated_effort}</p></div><div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3"><p className="text-[11px] text-slate-500">Suggested deadline</p><p className="mt-1 text-sm font-semibold text-amber-300">{new Date(`${analysis.suggested_deadline}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</p></div></div>
            <div className="grid gap-4 lg:grid-cols-3"><div><p className="text-xs font-semibold text-slate-300">Suggested subtasks</p><ul className="mt-2 space-y-2">{analysis.suggested_subtasks.map((item) => <li key={item} className="flex gap-2 text-xs text-slate-400"><Check size={14} className="mt-0.5 shrink-0 text-emerald-400" />{item}</li>)}</ul></div><div><p className="text-xs font-semibold text-slate-300">Potential blockers</p><ul className="mt-2 space-y-2">{analysis.potential_blockers.map((item) => <li key={item} className="flex gap-2 text-xs text-slate-400"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />{item}</li>)}</ul></div><div className="rounded-lg border border-emerald-500/15 bg-emerald-500/[0.06] p-3"><p className="text-xs font-semibold text-emerald-300">Recommended next action</p><p className="mt-2 text-xs leading-relaxed text-slate-300">{analysis.recommended_next_action}</p></div></div>
          </div>}
        </div>
      </section>

      {(isCreating || editingTask) && <TaskForm initial={editingTask} onCancel={() => { setIsCreating(false); setEditingTask(undefined); }} onSave={saveTask} />}

      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <label className="relative block flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tasks..." className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 pl-9 pr-3 text-sm text-white outline-none focus:border-amber-400" />
          </label>
          <div className="flex flex-wrap gap-2">
            <select value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)} className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-slate-300 outline-none focus:border-amber-400"><option value="all">All statuses</option><option value="open">Open</option><option value="completed">Completed</option></select>
            <select value={priority} onChange={(event) => setPriority(event.target.value as Priority | "all")} className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-slate-300 outline-none focus:border-amber-400"><option value="all">All priorities</option><option value="high">High priority</option><option value="medium">Medium priority</option><option value="low">Low priority</option></select>
          </div>
        </div>

        {error && <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-300"><span>{error}</span><button onClick={() => void loadTasks()} className="font-semibold text-rose-200 underline">Retry</button></div>}

        <div className="mt-4 space-y-2">
          {loading ? <div className="flex items-center justify-center gap-2 py-14 text-sm text-slate-500"><span className="h-4 w-4 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" /> Loading tasks...</div> : filteredTasks.length === 0 ? <div className="flex flex-col items-center justify-center py-14 text-center"><ClipboardList size={28} className="text-slate-600" /><p className="mt-3 text-sm font-medium text-slate-300">{tasks.length === 0 ? "Your task queue is clear" : "No tasks match these filters"}</p><p className="mt-1 text-xs text-slate-500">{tasks.length === 0 ? "Add the next piece of work to get started." : "Try a different search or filter."}</p></div> : filteredTasks.map((task) => <article key={task.id} className={`group rounded-lg border border-slate-800 bg-slate-950/50 p-4 transition hover:border-slate-700 ${task.completed ? "opacity-65" : ""}`}>
            <div className="flex items-start gap-3">
              <button onClick={() => !task.completed && void completeTask(task)} disabled={task.completed} className={`mt-0.5 shrink-0 ${task.completed ? "text-emerald-400" : "text-slate-600 hover:text-amber-400"}`} aria-label={task.completed ? "Task completed" : "Mark task complete"}>{task.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}</button>
              <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className={`h-2 w-2 rounded-full ${task.priority === "high" ? "bg-rose-400" : task.priority === "medium" ? "bg-amber-400" : "bg-slate-500"}`} title={`${task.priority} priority`} /><h3 className={`font-medium text-white ${task.completed ? "line-through text-slate-500" : ""}`}>{task.title}</h3><span className={`rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${priorityStyles[task.priority]}`}>{task.priority}</span></div>{task.description && <p className="mt-1.5 line-clamp-2 text-sm text-slate-400">{task.description}</p>}<div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">{task.due_date ? <span className="inline-flex items-center gap-1.5"><CalendarDays size={13} /> Due {new Date(`${task.due_date}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span> : <span className="inline-flex items-center gap-1.5"><CalendarDays size={13} /> No due date</span>}<span className={task.completed ? "text-emerald-400" : "text-slate-600"}>{task.completed ? "Completed" : "Open"}</span></div></div>
              <div className="flex shrink-0 items-center gap-1"><button onClick={() => void analyzeSelectedTask(task.id)} disabled={analysisLoading} className="rounded-lg px-2 py-1.5 text-[11px] font-medium text-amber-300 hover:bg-amber-400/10 disabled:opacity-50" title="Analyze with AI">AI</button><button onClick={() => { setEditingTask(task); setIsCreating(false); }} className="rounded-lg p-2 text-slate-500 hover:bg-slate-800 hover:text-white" aria-label={`Edit ${task.title}`} title="Edit task"><Pencil size={15} /></button><button onClick={() => void removeTask(task.id)} className="rounded-lg p-2 text-slate-500 hover:bg-rose-500/10 hover:text-rose-300" aria-label={`Delete ${task.title}`} title="Delete task"><Trash2 size={15} /></button></div>
            </div>
          </article>)}
        </div>
      </div>
    </section>
  );
}