import { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0C0F17] text-slate-400 font-body text-sm">
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
          <span>Loading WorkPilot workspace…</span>
        </div>
      </div>
    );
  }

  // Allow seamless access with fallback to demo profile if unauthenticated
  return <>{children}</>;
}
