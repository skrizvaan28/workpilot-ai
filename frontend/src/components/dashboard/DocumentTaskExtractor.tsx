import { useState } from "react";
import { Check, ClipboardPaste, FileText, LoaderCircle, Sparkles } from "lucide-react";
import { api, ExtractedTask } from "../../lib/api";

interface DocumentTaskExtractorProps {
  onTasksCreated: () => Promise<void>;
}

const priorityStyles = {
  high: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  medium: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  low: "border-slate-700 bg-slate-800/70 text-slate-300",
};

export function DocumentTaskExtractor({ onTasksCreated }: DocumentTaskExtractorProps) {
  const [content, setContent] = useState("");
  const [tasks, setTasks] = useState<ExtractedTask[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function extractTasks() {
    if (!content.trim()) {
      setError("Paste some work requirements before extracting tasks.");
      setSuccess("");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const response = await api.extractDocumentTasks(content);
      setTasks(response.tasks);
      setSelected(new Set(response.tasks.map((_, index) => index)));
      if (response.tasks.length === 0) {
        setError("No actionable tasks were found. Try adding bullets or clear work statements.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to extract tasks from this document.");
      setTasks([]);
      setSelected(new Set());
    } finally {
      setLoading(false);
    }
  }

  function toggleSelected(index: number) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
    setSuccess("");
  }

  async function createSelectedTasks() {
    const selectedTasks = tasks.filter((_, index) => selected.has(index));
    if (selectedTasks.length === 0) {
      setError("Select at least one extracted task to create.");
      return;
    }
    setCreating(true);
    setError("");
    setSuccess("");
    try {
      await Promise.all(selectedTasks.map((task) => api.createTask({
        title: task.title,
        description: task.description,
        priority: task.priority,
        due_date: task.due_date,
      })));
      await onTasksCreated();
      setSuccess(`${selectedTasks.length} task${selectedTasks.length === 1 ? "" : "s"} added to your queue.`);
      setTasks([]);
      setSelected(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create the selected tasks.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-xl border border-cyan-500/20 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.1),transparent_38%),#0f172a] shadow-sm">
      <div className="border-b border-cyan-500/15 px-4 py-4 sm:px-5">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-cyan-400/10 p-2 text-cyan-300"><Sparkles size={18} /></div>
          <div><p className="text-xs uppercase tracking-[0.18em] text-cyan-300">AI workflow</p><h2 className="mt-1 font-display text-lg font-semibold text-white">AI Document <span className="text-slate-500">→</span> Tasks</h2><p className="mt-1 text-xs text-slate-400">Paste requirements and review the task drafts before they enter your queue.</p></div>
        </div>
      </div>
      <div className="space-y-4 p-4 sm:p-5">
        <div className="relative">
          <ClipboardPaste size={16} className="absolute left-3 top-3 text-slate-500" />
          <textarea value={content} onChange={(event) => { setContent(event.target.value); setError(""); setSuccess(""); }} rows={5} maxLength={20000} placeholder={'Paste project requirements here...\n- Prepare launch checklist by 2026-10-01\n- Review security controls'} className="w-full resize-y rounded-lg border border-slate-700 bg-slate-950 px-9 py-3 text-sm leading-relaxed text-white outline-none transition focus:border-cyan-400" />
          <span className="absolute bottom-2 right-3 text-[10px] text-slate-600">{content.length}/20000</span>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">The local deterministic assistant identifies bullets, sentences, priorities, and ISO dates.</p>
          <button onClick={() => void extractTasks()} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-wait disabled:opacity-60"><Sparkles size={15} />{loading ? "Extracting..." : "Extract Tasks with AI"}</button>
        </div>

        {error && <div className="rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2.5 text-xs text-rose-300">{error}</div>}
        {success && <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2.5 text-xs text-emerald-300">{success}</div>}

        {loading && <div className="flex items-center gap-2 py-4 text-sm text-slate-400"><LoaderCircle size={16} className="animate-spin text-cyan-300" /> Reading work requirements...</div>}
        {!loading && tasks.length === 0 && !error && <div className="flex items-center gap-3 rounded-lg border border-dashed border-slate-800 px-4 py-5 text-sm text-slate-500"><FileText size={18} className="text-slate-600" /><span>Extracted task drafts will appear here for review.</span></div>}
        {!loading && tasks.length > 0 && <div className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Preview · {tasks.length} extracted</p><div className="flex gap-3 text-xs"><button onClick={() => setSelected(new Set(tasks.map((_, index) => index)))} className="text-cyan-300 hover:text-cyan-200">Select all</button><button onClick={() => setSelected(new Set())} className="text-slate-500 hover:text-slate-300">Clear</button></div></div>
          {tasks.map((task, index) => <label key={`${task.title}-${index}`} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${selected.has(index) ? "border-cyan-500/35 bg-cyan-400/[0.06]" : "border-slate-800 bg-slate-950/40 hover:border-slate-700"}`}>
            <input type="checkbox" checked={selected.has(index)} onChange={() => toggleSelected(index)} className="mt-1 h-4 w-4 accent-cyan-400" />
            <span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><span className="text-sm font-medium text-white">{task.title}</span><span className={`rounded border px-2 py-0.5 text-[10px] font-semibold uppercase ${priorityStyles[task.priority]}`}>{task.priority}</span><span className="text-[10px] text-slate-500">{task.estimated_effort} effort</span></span><span className="mt-1 block text-xs leading-relaxed text-slate-400">{task.description}</span><span className="mt-2 block text-[11px] text-slate-500">{task.due_date ? `Suggested due ${new Date(`${task.due_date}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}` : "No due date identified"}</span></span>
          </label>)}
          <div className="flex justify-end border-t border-slate-800 pt-3"><button onClick={() => void createSelectedTasks()} disabled={creating || selected.size === 0} className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"><Check size={15} />{creating ? "Creating tasks..." : `Create selected (${selected.size})`}</button></div>
        </div>}
      </div>
    </section>
  );
}