import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const readout = [
  { label: "HR Onboarding Agent", status: "active", detail: "3 tasks queued" },
  { label: "IT Provisioning Agent", status: "active", detail: "1 task running" },
  { label: "Finance Reconciliation Agent", status: "idle", detail: "next run 06:00" },
  { label: "Compliance Watcher", status: "error", detail: "auth token expired" },
];

const statusColor: Record<string, string> = {
  active: "bg-ok",
  idle: "bg-inkMuted",
  error: "bg-err",
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-5 bg-base font-body">
      <div className="hidden lg:flex lg:col-span-3 flex-col justify-between p-14 bg-[#0F1116] border-r border-line">
        <div>
          <div className="flex items-center gap-2 mb-16">
            <div className="h-2 w-2 rounded-full bg-signal" />
            <span className="text-ink font-display text-lg tracking-tight">WorkPilot AI</span>
          </div>
          <h1 className="font-display text-4xl leading-tight text-ink max-w-md">
            One console for every agent running your back office.
          </h1>
          <p className="mt-5 text-inkMuted max-w-sm leading-relaxed">
            HR, IT, and Finance agents report here — what they did, what they're
            waiting on, and what needs a human.
          </p>
        </div>

        <div className="border border-line rounded bg-panel/40 p-5 max-w-md">
          <div className="text-xs text-inkMuted mb-4 font-body">Live agent status</div>
          <div className="space-y-3">
            {readout.map((row) => (
              <div key={row.label} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${statusColor[row.status]}`} />
                  <span className="text-ink">{row.label}</span>
                </div>
                <span className="text-inkMuted text-xs">{row.detail}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <div className="h-2 w-2 rounded-full bg-signal" />
            <span className="text-ink font-display text-lg">WorkPilot AI</span>
          </div>

          <h2 className="font-display text-2xl text-ink mb-1">Sign in</h2>
          <p className="text-inkMuted text-sm mb-8">Use your workspace credentials.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-inkMuted mb-1.5">Work email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-panel border border-line rounded px-3 py-2.5 text-ink text-sm outline-none focus:border-signal transition-colors"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="block text-xs text-inkMuted mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-panel border border-line rounded px-3 py-2.5 text-ink text-sm outline-none focus:border-signal transition-colors"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="text-sm text-err bg-err/10 border border-err/30 rounded px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-signal text-[#1A1408] font-medium text-sm rounded px-3 py-2.5 hover:bg-signal/90 transition-colors disabled:opacity-60"
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-sm text-inkMuted">
            New to WorkPilot?{" "}
            <Link to="/register" className="text-signal hover:underline">
              Create a workspace account
            </Link>
          </p>

          <div className="mt-4 pt-4 border-t border-line text-center">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors font-medium"
            >
              <span>Explore Demo Dashboard without signing in →</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

