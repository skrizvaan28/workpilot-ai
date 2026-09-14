import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  Sparkles,
  Menu,
  Moon,
  Sun,
  Plus,
  CheckCircle2,
  ChevronDown,
  LogOut,
  User,
  Shield,
} from 'lucide-react';
import { mockNotifications } from '../../data/mockDashboardData';

interface TopHeaderProps {
  onOpenMobileSidebar: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenCreateTask: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  onLogout?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onOpenMobileSidebar,
  searchQuery,
  onSearchChange,
  onOpenCreateTask,
  theme,
  onToggleTheme,
  userName = 'Rizvaan Shaik',
  userEmail = 'rizvaan@workpilot.ai',
  userRole = 'Lead Product Architect',
  onLogout,
}) => {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(mockNotifications);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = unreadNotifications.filter((n) => n.unread).length;

  const markAllRead = () => {
    setUnreadNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="h-16 border-b sticky top-0 z-30 transition-colors bg-[#0D111A]/95 backdrop-blur-md border-slate-800/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
      {/* Left side: Mobile Toggle & Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          aria-label="Open sidebar"
        >
          <Menu size={20} />
        </button>

        {/* Global Search Bar */}
        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <Search size={16} />
          </div>
          <input
            type="text"
            placeholder="Search tasks, documents, AI insights... (Ctrl + K)"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-12 py-1.5 text-xs sm:text-sm rounded-lg border bg-slate-900/80 text-slate-200 placeholder-slate-500 border-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50 transition"
          />
          <div className="absolute inset-y-0 right-0 pr-2.5 hidden sm:flex items-center pointer-events-none">
            <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* AI Status Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-xs font-medium text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="flex items-center gap-1 font-mono tracking-tight">
            <Sparkles size={12} className="text-emerald-400" />
            AI Status: Ready
          </span>
        </div>

        {/* Quick Action: New Task Button */}
        <button
          onClick={onOpenCreateTask}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-sm transition active:scale-95"
        >
          <Plus size={15} strokeWidth={2.5} />
          <span>New Task</span>
        </button>

        {/* Dark/Light Theme Toggle */}
        <button
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
        >
          {theme === 'dark' ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} />}
        </button>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition relative"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-4 min-w-[16px] px-1 rounded-full bg-amber-500 text-slate-950 font-mono text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 text-slate-200">
              <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-white">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1"
                  >
                    <CheckCircle2 size={12} />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="divide-y divide-slate-800/80 max-h-72 overflow-y-auto">
                {unreadNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3.5 transition hover:bg-slate-800/50 flex gap-3 ${
                      notif.unread ? 'bg-slate-800/30' : ''
                    }`}
                  >
                    <div className="h-2 w-2 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <strong className="text-white font-medium">{notif.title}</strong>
                        <span className="text-slate-400 text-[10px]">{notif.time}</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{notif.message}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-4 py-2 border-t border-slate-800 text-center bg-slate-950/50">
                <span className="text-[11px] text-slate-400">
                  AI continuous monitoring enabled
                </span>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800/70 transition"
          >
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-slate-950 font-bold text-xs shadow-sm">
              {getInitials(userName)}
            </div>
            <div className="hidden xl:block text-left text-xs leading-tight">
              <div className="font-semibold text-white truncate max-w-[120px]">{userName}</div>
              <div className="text-slate-400 text-[10px] truncate max-w-[120px]">{userRole}</div>
            </div>
            <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-60 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl z-50 overflow-hidden text-slate-200">
              <div className="p-3 border-b border-slate-800 bg-slate-950/40">
                <div className="font-semibold text-sm text-white">{userName}</div>
                <div className="text-xs text-slate-400 truncate">{userEmail}</div>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Shield size={11} /> {userRole}
                </div>
              </div>

              <div className="p-1.5 space-y-0.5 text-xs">
                <button
                  onClick={() => setProfileOpen(false)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition"
                >
                  <User size={15} />
                  <span>Account Profile</span>
                </button>
                <button
                  onClick={() => setProfileOpen(false)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition"
                >
                  <Sparkles size={15} className="text-amber-400" />
                  <span>AI Agent Preferences</span>
                </button>
              </div>

              <div className="p-1.5 border-t border-slate-800">
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    if (onLogout) onLogout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 text-xs transition"
                >
                  <LogOut size={14} />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
