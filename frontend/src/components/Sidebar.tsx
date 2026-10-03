import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CheckSquare,
  Bell,
  Bot,
  BookOpen,
  BarChart3,
  Trophy,
  Settings,
  User,
  LogOut,
  Users,
  ShieldCheck,
  BriefcaseBusiness,
  Monitor,
  WalletCards,
  ClipboardList,
} from "lucide-react";

const navItems = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Tasks",
    path: "/tasks",
    icon: CheckSquare,
  },
  {
    label: "Alert Inbox",
    path: "/alerts",
    icon: Bell,
    badge: true,
  },
  {
    label: "AI Copilot",
    path: "/ai-copilot",
    icon: Bot,
  },
  {
    label: "Knowledge Base",
    path: "/knowledge-base",
    icon: BookOpen,
  },
  {
    label: "Reports & Analytics",
    path: "/reports",
    icon: BarChart3,
  },
  {
    label: "Rewards & Streaks",
    path: "/rewards",
    icon: Trophy,
  },
  {
    label: "Settings",
    path: "/settings",
    icon: Settings,
  },
];

const workspaceItems = [
  {
    label: "Agents",
    icon: Users,
  },
  {
    label: "HR",
    icon: BriefcaseBusiness,
  },
  {
    label: "IT",
    icon: Monitor,
  },
  {
    label: "Finance",
    icon: WalletCards,
  },
  {
    label: "Audit Log",
    icon: ClipboardList,
  },
];

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    return (
      location.pathname === path ||
      location.pathname.startsWith(path + "/")
    );
  };

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-slate-800 bg-slate-950 text-slate-100">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500 text-sm font-bold text-slate-950">
          W
        </div>

        <div>
          <h1 className="text-base font-semibold text-white">
            WorkPilot AI
          </h1>

          <p className="text-xs text-slate-500">
            Productivity Platform
          </p>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Main Menu
        </p>

        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition-all duration-200 ${
                  active
                    ? "bg-amber-500/10 text-amber-400"
                    : "text-slate-400 hover:bg-slate-900 hover:text-white"
                }`}
              >
                <Icon
                  size={19}
                  className={`shrink-0 ${
                    active
                      ? "text-amber-400"
                      : "text-slate-500 group-hover:text-slate-300"
                  }`}
                />

                <span className="flex-1">
                  {item.label}
                </span>

                {item.badge && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                    !
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Workspace */}
        <div className="mt-7">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Workspace
          </p>

          <div className="space-y-1">
            {workspaceItems.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.label}
                  className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-slate-400 transition-all duration-200 hover:bg-slate-900 hover:text-white"
                >
                  <Icon
                    size={18}
                    className="text-slate-500 group-hover:text-slate-300"
                  />

                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-slate-800 p-3">
        {/* Profile */}
        <button
          onClick={() => navigate("/settings")}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-slate-900"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800">
            <User size={18} className="text-slate-400" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">
              User
            </p>

            <p className="truncate text-xs text-slate-500">
              WorkPilot Account
            </p>
          </div>
        </button>

        {/* Logout */}
        <button
          onClick={() => {
            localStorage.removeItem("workpilot_token");
            navigate("/login");
          }}
          className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400 transition hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut size={18} />

          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;