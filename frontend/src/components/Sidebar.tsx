const navItems = [
  { label: "Overview", active: true },
  { label: "Agents" },
  { label: "HR" },
  { label: "IT" },
  { label: "Finance" },
  { label: "Audit log" },
  { label: "Settings" },
];

export function Sidebar() {
  return (
    <aside className="w-56 shrink-0 bg-[#0F1116] border-r border-line flex flex-col">
      <div className="h-16 flex items-center gap-2 px-5 border-b border-line">
        <div className="h-2 w-2 rounded-full bg-signal" />
        <span className="text-ink font-display text-base">WorkPilot AI</span>
      </div>
      <nav className="flex-1 py-4">
        {navItems.map((item) => (
          <button
            key={item.label}
            className={`w-full text-left px-5 py-2 text-sm transition-colors border-l-2 ${
              item.active
                ? "border-signal text-ink bg-panel/60"
                : "border-transparent text-inkMuted hover:text-ink hover:bg-panel/30"
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div className="px-5 py-4 border-t border-line text-xs text-inkMuted">
        Foundation build, v0.1.0
      </div>
    </aside>
  );
}

