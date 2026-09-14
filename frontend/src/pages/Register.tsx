import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await register(fullName, email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base font-body p-8">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-10">
          <div className="h-2 w-2 rounded-full bg-signal" />
          <span className="text-ink font-display text-lg">WorkPilot AI</span>
        </div>

        <h2 className="font-display text-2xl text-ink mb-1">Create your workspace</h2>
        <p className="text-inkMuted text-sm mb-8">Takes about a minute.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-inkMuted mb-1.5">Full name</label>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-panel border border-line rounded px-3 py-2.5 text-ink text-sm outline-none focus:border-signal transition-colors"
              placeholder="Abhilash Reddy"
            />
          </div>
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
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-panel border border-line rounded px-3 py-2.5 text-ink text-sm outline-none focus:border-signal transition-colors"
              placeholder="At least 8 characters"
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
            {submitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-sm text-inkMuted">
          Already have a workspace?{" "}
          <Link to="/login" className="text-signal hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

