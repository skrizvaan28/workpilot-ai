import { useAuth } from "../context/AuthContext";

export function Topbar() {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 border-b border-line flex items-center justify-between px-8 bg-base">
      <div>
        <h1 className="font-display text-lg text-ink">Overview</h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="text-sm text-ink leading-tight">{user?.full_name}</div>
          <div className="text-xs text-inkMuted leading-tight">{user?.email}</div>
        </div>
        <button
          onClick={logout}
          className="text-sm text-inkMuted border border-line rounded px-3 py-1.5 hover:text-ink hover:border-signal/50 transition-colors"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}

