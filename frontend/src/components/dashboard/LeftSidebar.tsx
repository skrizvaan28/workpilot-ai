import React from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  FileText,
  Bot,
  BarChart3,
  Users,
  Settings,
  Sparkles,
  Zap,
  X,
  ExternalLink,
  Bell,
} from 'lucide-react';

interface LeftSidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  taskCount: number;
  alertCount: number;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  activeTab,
  onSelectTab,
  isMobileOpen,
  onCloseMobile,
  taskCount,
  alertCount,
}) => {
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks', label: 'My Tasks', icon: CheckSquare, badge: taskCount },
    { id: 'alerts', label: 'Alert Inbox', icon: Bell, alertBadge: alertCount },
    { id: 'documents', label: 'Documents', icon: FileText, tag: 'RAG' },
    { id: 'ai-assistant', label: 'AI Assistant', icon: Bot, highlight: true },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 border-r transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto flex flex-col justify-between
          bg-[#0C0F17] text-slate-200 border-slate-800/80
          ${isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}
      >
        {/* Top Branding Section */}
        <div>
          <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/70">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/20 text-slate-950">
                <Sparkles className="h-5 w-5 fill-current" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-bold text-base text-white tracking-tight">
                    WorkPilot
                  </span>
                  <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20">
                    AI
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 tracking-wider uppercase font-medium">
                  Productivity Engine
                </p>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>

          {/* Workspace Switcher Pill */}
          <div className="px-3.5 pt-4 pb-2">
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
                <span className="font-medium text-slate-300 truncate">Enterprise Workspace</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                PRO
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 py-2 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    if (isMobileOpen) onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative ${
                    isActive
                      ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      size={18}
                      className={`transition-colors ${
                        isActive
                          ? 'text-amber-400'
                          : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {/* Badges or tags */}
                  {item.badge !== undefined && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-mono font-medium ${
                        isActive
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}

                  {item.alertBadge !== undefined && item.alertBadge > 0 && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
                        isActive
                          ? 'bg-rose-400 text-slate-950'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {item.alertBadge}
                    </span>
                  )}

                  {item.tag && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                      {item.tag}
                    </span>
                  )}

                  {item.highlight && !isActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Status & Quota Card */}
        <div className="p-3.5 border-t border-slate-800/80 space-y-3">
          <div className="p-3 rounded-xl bg-gradient-to-b from-slate-900/80 to-slate-950 border border-slate-800/90 text-xs">
            <div className="flex items-center justify-between text-slate-300 mb-2 font-medium">
              <span className="flex items-center gap-1.5">
                <Zap size={14} className="text-amber-400" />
                AI Inference Quota
              </span>
              <span className="text-[11px] font-mono text-emerald-400">94%</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-400 to-emerald-400 h-full rounded-full"
                style={{ width: '94%' }}
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
              <span>9,400 / 10,000 credits</span>
              <span className="text-slate-500">Tier 1</span>
            </p>
          </div>

          <div className="flex items-center justify-between px-1 text-[11px] text-slate-400">
            <span>WorkPilot AI Core v0.2.0</span>
            <span className="flex items-center gap-1 text-slate-400 hover:text-slate-300">
              Docs <ExternalLink size={10} />
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
