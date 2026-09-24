import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

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

  // If not authenticated, redirect to login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

