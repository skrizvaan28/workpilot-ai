import { FormEvent, useState } from "react";
import {
  ArrowUp,
  Bot,
  CheckCircle2,
  CircleAlert,
  FileText,
  Loader2,
  Sparkles,
  Target,
} from "lucide-react";
import { api, CopilotResponse, Task } from "../lib/api";

interface Message {
  role: "user" | "assistant";
  text: string;
  response?: CopilotResponse;
}

const quickActions = [
  "Show overdue tasks",
  "What should I work on?",
  "Show my workload",
  "Search Knowledge Base",
  "Create a task",
];

function TaskCard({ task }: { task: Task }) {
  return (
    <div className="rounded-xl border border-slate-700/70 bg-slate-950/70 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-slate-100">{task.title}</p>
          {task.description && <p className="mt-1 text-xs text-slate-400">{task.description}</p>}
        </div>
        <span className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${task.priority === "high" ? "bg-rose-500/15 text-rose-300" : task.priority === "medium" ? "bg-amber-500/15 text-amber-300" : "bg-slate-800 text-slate-400"}`}>
          {task.priority}
        </span>
      </div>
      <div className="mt-3 flex items-center gap-3 text-[11px] text-slate-500">
        <span className="flex items-center gap-1"><Target size={13} /> {task.completed ? "Completed" : task.status.replace("_", " ")}</span>
        <span>{task.progress}%</span>
        {task.due_date && <span>Due {task.due_date}</span>}
      </div>
    </div>
  );
}

export default function AICopilot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "I’m ready to help with your WorkPilot tasks, workload, productivity, and knowledge base.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activity, setActivity] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(message: string) {
    const cleaned = message.trim();
    if (!cleaned || loading) return;
    setInput("");
    setError(null);
    setMessages((current) => [...current, { role: "user", text: cleaned }]);
    setLoading(true);
    setActivity("Understanding request...");
    try {
      const response = await api.copilot(cleaned);
      setMessages((current) => [
        ...current,
        { role: "assistant", text: response.message, response },
      ]);
      if (!response.success) setError(response.message);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The copilot could not complete that request.");
    } finally {
      setLoading(false);
      setActivity(null);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submit(input);
  }

  return (
    <section className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-800 bg-[#0D111A] shadow-2xl shadow-black/20">
      <header className="flex items-center justify-between border-b border-slate-800 px-5 py-4 sm:px-7">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/10"><Sparkles size={19} /></div>
          <div>
            <div className="flex items-center gap-2"><h1 className="font-display text-lg font-semibold text-white">WorkPilot Copilot</h1><span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">Ready</span></div>
            <p className="text-xs text-slate-500">Your authenticated productivity workspace assistant</p>
          </div>
        </div>
        <div className="hidden items-center gap-2 text-xs text-slate-500 sm:flex"><span className="h-2 w-2 rounded-full bg-emerald-400" />Live workspace data</div>
      </header>

      <div aria-live="polite" className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-7">
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            {message.role === "assistant" && <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-amber-400"><Bot size={16} /></div>}
            <div className={`max-w-[90%] space-y-3 sm:max-w-[78%] ${message.role === "user" ? "items-end" : "items-start"}`}>
              <div className={`rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "user" ? "rounded-tr-sm bg-amber-400 text-slate-950" : "rounded-tl-sm border border-slate-800 bg-slate-900/80 text-slate-300"}`}>{message.text}</div>
              {message.response?.action && <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-emerald-400"><CheckCircle2 size={13} />{message.response.action.replace(/_/g, " ")}</div>}
              {message.response?.requires_confirmation && <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">Confirmation required before this action can run.</div>}
              {message.response?.tasks && message.response.tasks.length > 0 && <div className="grid gap-2">{message.response.tasks.map((task) => <TaskCard key={task.id} task={task} />)}</div>}
              {message.response?.workload && (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {[["Total", message.response.workload.total_tasks], ["Completed", message.response.workload.completed], ["Open", message.response.workload.in_progress + message.response.workload.pending], ["Overdue", message.response.workload.overdue], ["High priority", message.response.workload.high_priority]].map(([label, value]) => <div key={label} className="rounded-xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p><p className="mt-1 text-xl font-semibold text-white">{value}</p></div>)}
                </div>
              )}
              {message.response?.knowledge_sources && message.response.knowledge_sources.length > 0 && (
                <div className="space-y-2">{message.response.knowledge_sources.map((source) => <div key={`${source.document_id}-${source.chunk_index}`} className="rounded-xl border border-slate-800 bg-slate-950/70 p-3"><div className="flex items-center gap-2 text-xs font-medium text-amber-300"><FileText size={14} />{source.title}</div><p className="mt-2 text-xs leading-5 text-slate-400">{source.content}</p><p className="mt-2 text-[10px] text-slate-600">{Math.round(source.similarity * 100)}% relevance</p></div>)}</div>
              )}
              {message.response?.suggested_steps && message.response.suggested_steps.length > 0 && <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3"><p className="mb-2 text-xs font-semibold text-slate-300">Suggested plan</p><ol className="list-decimal space-y-1 pl-4 text-xs leading-5 text-slate-400">{message.response.suggested_steps.map((step) => <li key={step}>{step}</li>)}</ol></div>}
            </div>
          </div>
        ))}
        {loading && <div className="flex items-center gap-3 text-sm text-slate-500"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-amber-400"><Bot size={16} /></div><Loader2 size={16} className="animate-spin" />{activity}</div>}
        {error && <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300"><CircleAlert size={16} />{error}</div>}
      </div>

      <div className="border-t border-slate-800 bg-[#0B0F17] p-4 sm:p-5">
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1">{quickActions.map((action) => <button key={action} type="button" onClick={() => void submit(action)} disabled={loading} className="whitespace-nowrap rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-300 transition hover:border-amber-400/50 hover:text-amber-300 disabled:cursor-not-allowed disabled:opacity-50">{action}</button>)}</div>
        <form onSubmit={handleSubmit} className="flex items-end gap-3 rounded-xl border border-slate-700 bg-slate-900/80 p-2 focus-within:border-amber-400/60">
          <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void submit(input); } }} rows={1} placeholder="Ask WorkPilot to find, create, or explain something..." className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-600" aria-label="Copilot message" />
          <button type="submit" disabled={loading || !input.trim()} aria-label="Send message" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-400 text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"><ArrowUp size={18} /></button>
        </form>
        <p className="mt-2 flex items-center gap-1 text-[10px] text-slate-600"><CheckCircle2 size={12} />Responses use your authenticated WorkPilot data</p>
      </div>
    </section>
  );
}
