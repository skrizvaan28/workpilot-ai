import { AlertCircle, Inbox, LoaderCircle, RefreshCw } from "lucide-react";

interface FeedbackProps {
  message?: string;
  title?: string;
  onRetry?: () => void;
  className?: string;
}

export function LoadingState({ message = "Loading your workspace...", className = "" }: FeedbackProps) {
  return (
    <div role="status" aria-live="polite" className={`flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/65 px-4 py-8 text-sm text-slate-400 ${className}`}>
      <LoaderCircle size={17} className="shrink-0 animate-spin text-amber-300" />
      <span>{message}</span>
    </div>
  );
}

export function EmptyState({ title = "Nothing here yet", message = "Create your first item to get started.", className = "" }: FeedbackProps) {
  return (
    <div className={`rounded-xl border border-dashed border-slate-700 bg-slate-900/45 px-5 py-10 text-center ${className}`}>
      <Inbox size={26} className="mx-auto text-slate-600" aria-hidden="true" />
      <h3 className="mt-3 font-display text-base font-semibold text-slate-300">{title}</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">{message}</p>
    </div>
  );
}

export function ErrorState({ message = "Unable to load this workspace view.", onRetry, className = "" }: FeedbackProps) {
  return (
    <div role="alert" className={`flex flex-col gap-3 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-4 text-sm text-rose-200 sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <span className="flex items-start gap-2"><AlertCircle size={17} className="mt-0.5 shrink-0 text-rose-300" />{message}</span>
      {onRetry && <button type="button" onClick={onRetry} className="inline-flex items-center gap-1.5 self-start rounded-lg border border-rose-400/30 px-3 py-1.5 text-xs font-semibold text-rose-100 transition hover:bg-rose-500/15 focus:outline-none focus:ring-2 focus:ring-rose-300/50"><RefreshCw size={13} />Retry</button>}
    </div>
  );
}
