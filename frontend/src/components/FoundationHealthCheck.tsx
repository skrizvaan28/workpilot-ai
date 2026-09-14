import { useState, useEffect } from "react";
import { CheckCircle2, AlertCircle, RefreshCw, Server, Laptop, Layers, Shield } from "lucide-react";
import { api } from "../lib/api";

interface HealthStatus {
  status: string;
  environment?: string;
  service?: string;
  version?: string;
}

export default function FoundationHealthCheck() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.health();
      setHealth(data);
    } catch (err: any) {
      setError(err?.message || "Could not reach backend API at /api/health");
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto my-8 p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-sm text-slate-100 font-sans">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Step 1: Foundation Active
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            WorkPilot AI System Status
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Foundation environment confirmation and service diagnostics.
          </p>
        </div>

        <button
          onClick={checkStatus}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 border border-slate-700 transition duration-150 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin text-blue-400" : ""} />
          {loading ? "Checking..." : "Re-check Services"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {/* Frontend Status Card */}
        <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Laptop size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-white">Frontend Service</h3>
                <p className="text-xs text-slate-400">React + TypeScript + Vite + Tailwind</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 size={13} />
              Online
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/60 text-xs text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Port:</span>
              <span className="font-mono text-slate-300">5173</span>
            </div>
            <div className="flex justify-between">
              <span>API Proxy:</span>
              <span className="font-mono text-slate-300">/api &rarr; :8000</span>
            </div>
          </div>
        </div>

        {/* Backend Status Card */}
        <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Server size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-white">Backend API</h3>
                <p className="text-xs text-slate-400">Python + FastAPI</p>
              </div>
            </div>
            {loading ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <RefreshCw size={12} className="animate-spin" />
                Connecting
              </span>
            ) : health ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 size={13} />
                Online
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <AlertCircle size={13} />
                Offline
              </span>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/60 text-xs text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Endpoint:</span>
              <span className="font-mono text-slate-300">GET /api/health</span>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="font-mono text-slate-300">
                {loading ? "Checking..." : health ? `status: ${health.status}` : "Backend not started"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Backend helper alert if offline */}
      {!loading && error && (
        <div className="mt-4 p-3.5 rounded-xl bg-amber-950/30 border border-amber-900/40 text-xs text-amber-300/90 flex items-start gap-2.5">
          <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold block text-amber-200">Backend server is not running yet</strong>
            To start it, open a terminal in <code className="bg-amber-900/30 px-1 py-0.5 rounded font-mono text-amber-100">backend</code> and run:
            <code className="block mt-1 font-mono text-slate-200 bg-slate-950 px-2.5 py-1.5 rounded border border-slate-800">
              uvicorn app.main:app --reload --port 8000
            </code>
          </div>
        </div>
      )}

      {/* Architecture Roadmap Checklist */}
      <div className="mt-6 pt-5 border-t border-slate-800">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
          <Layers size={14} />
          Project Architecture Plan
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-800/30 text-emerald-300">
            <span className="font-medium block text-emerald-200">1. Foundation</span>
            FastAPI + React Vite (Active)
          </div>
          <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/60 text-slate-400">
            <span className="font-medium block text-slate-300">2. Database</span>
            PostgreSQL + pgvector
          </div>
          <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/60 text-slate-400">
            <span className="font-medium block text-slate-300">3. Auth</span>
            JWT Authentication
          </div>
          <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/60 text-slate-400">
            <span className="font-medium block text-slate-300">4. AI & ML</span>
            LLM API + RAG + scikit-learn
          </div>
        </div>
      </div>
    </div>
  );
}
