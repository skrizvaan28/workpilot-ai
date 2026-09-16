import React, { useState } from 'react';
import { LeftSidebar } from '../components/dashboard/LeftSidebar';
import { TopHeader } from '../components/dashboard/TopHeader';
import { MetricCards } from '../components/dashboard/MetricCards';
import { ProductivityOverview } from '../components/dashboard/ProductivityOverview';
import { MyTasksTable } from '../components/dashboard/MyTasksTable';
import { AIInsightCard } from '../components/dashboard/AIInsightCard';
import { QuickActions } from '../components/dashboard/QuickActions';
import { RecentActivityList } from '../components/dashboard/RecentActivityList';
import { DocumentsView } from '../components/dashboard/DocumentsView';
import { TeamView } from '../components/dashboard/TeamView';
import { AnalyticsView } from '../components/dashboard/AnalyticsView';
import { SettingsView } from '../components/dashboard/SettingsView';
import { AlertInbox } from '../components/dashboard/AlertInbox';
import { CreateTaskModal } from '../components/modals/CreateTaskModal';
import { UploadDocumentModal } from '../components/modals/UploadDocumentModal';
import { AskAIModal } from '../components/modals/AskAIModal';
import { useAuth } from '../context/AuthContext';
import {
  mockTasks,
  mockInsights,
  mockWeeklyProductivity,
  mockRecentActivities,
} from '../data/mockDashboardData';
import { Task, RecentActivityItem } from '../types/dashboard';

export default function Dashboard() {
  const { user, logout } = useAuth();

  // Tab State
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Theme State (Dark / Light)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Search Query
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState<boolean>(false);
  const [isUploadDocOpen, setIsUploadDocOpen] = useState<boolean>(false);
  const [isAskAIOpen, setIsAskAIOpen] = useState<boolean>(false);

  // Dynamic Workspace Data
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [activities, setActivities] = useState<RecentActivityItem[]>(mockRecentActivities);

  // Handle Task Completion Toggle
  const handleToggleTask = (taskId: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((t) => {
        if (t.id === taskId) {
          const nextStatus = t.status === 'completed' ? 'in_progress' : 'completed';
          const nextProgress = nextStatus === 'completed' ? 100 : 50;

          // Add activity event
          if (nextStatus === 'completed') {
            const newAct: RecentActivityItem = {
              id: `act-${Date.now()}`,
              title: 'Task Completed',
              description: `Marked "${t.title}" as completed`,
              timestamp: 'Just now',
              type: 'task',
              icon: 'CheckCircle2',
            };
            setActivities((acts) => [newAct, ...acts]);
          }

          return { ...t, status: nextStatus, progress: nextProgress };
        }
        return t;
      })
    );
  };

  // Handle Add New Task
  const handleAddTask = (newTaskData: Omit<Task, 'id'>) => {
    const id = `WP-${120 + tasks.length + 1}`;
    const task: Task = { ...newTaskData, id };
    setTasks((prev) => [task, ...prev]);

    // Add activity
    const newAct: RecentActivityItem = {
      id: `act-${Date.now()}`,
      title: 'New Task Created',
      description: `Created "${task.title}" with AI Priority Score ${task.aiPriorityScore}/100`,
      timestamp: 'Just now',
      type: 'task',
      icon: 'CheckCircle2',
    };
    setActivities((acts) => [newAct, ...acts]);
  };

  // Handle Document Extracted Tasks
  const handleTasksExtracted = (count: number) => {
    const newAct: RecentActivityItem = {
      id: `act-${Date.now()}`,
      title: 'Document Synthesized',
      description: `WorkPilot AI parsed document and generated ${count} structured backlog items`,
      timestamp: 'Just now',
      type: 'ai_agent',
      icon: 'Bot',
    };
    setActivities((acts) => [newAct, ...acts]);
  };

  // Metric Computations
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const pendingCount = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress').length;
  const overdueCount = tasks.filter((t) => t.status === 'overdue').length;
  const totalCount = tasks.length;
  const productivityScore = Math.min(
    Math.round((completedCount / Math.max(totalCount, 1)) * 100) + 19,
    98
  );

  // Alert Inbox: count active (non-completed, non-none urgency) tasks
  const alertCount = tasks.filter(
    (t) => t.urgency !== 'none' && t.status !== 'completed'
  ).length;

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // User display info
  const displayName = user?.full_name || 'Rizvaan Shaik';
  const displayEmail = user?.email || 'rizvaan@workpilot.ai';
  const displayRole = user?.role || 'Lead Product Architect';

  return (
    <div
      className={`min-h-screen flex font-body transition-colors duration-200 ${
        theme === 'dark'
          ? 'bg-[#0B0E14] text-slate-100'
          : 'bg-slate-100 text-slate-900 light-mode'
      }`}
    >
      {/* 1. LEFT SIDEBAR */}
      <LeftSidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'ai-assistant') {
            setIsAskAIOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        taskCount={pendingCount}
        alertCount={alertCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* 2. TOP HEADER */}
        <TopHeader
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenCreateTask={() => setIsCreateTaskOpen(true)}
          theme={theme}
          onToggleTheme={toggleTheme}
          userName={displayName}
          userEmail={displayEmail}
          userRole={displayRole}
          onLogout={logout}
        />

        {/* Dynamic Main Body Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <>
              {/* 3. DASHBOARD METRICS */}
              <MetricCards
                userName={displayName.split(' ')[0]}
                productivityScore={productivityScore}
                completedTasksCount={completedCount}
                totalTasksCount={totalCount}
                pendingTasksCount={pendingCount}
                overdueTasksCount={overdueCount}
                streakDays={14}
              />

              {/* 7. QUICK ACTIONS */}
              <QuickActions
                onOpenCreateTask={() => setIsCreateTaskOpen(true)}
                onOpenUploadDocument={() => setIsUploadDocOpen(true)}
                onOpenAskAI={() => setIsAskAIOpen(true)}
                onViewAnalytics={() => setActiveTab('analytics')}
              />

              {/* 6. AI INSIGHT CARD */}
              <AIInsightCard
                insights={mockInsights}
                tasks={tasks}
                onActionClick={(insight) => {
                  if (insight.type === 'improvement') {
                    setActiveTab('analytics');
                  } else if (insight.type === 'urgent') {
                    setIsAskAIOpen(true);
                  } else {
                    setActiveTab('tasks');
                  }
                }}
              />

              {/* 4. PRODUCTIVITY OVERVIEW */}
              <ProductivityOverview data={mockWeeklyProductivity} />

              {/* 5. MY TASKS & 8. RECENT ACTIVITY GRID */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2">
                  <MyTasksTable
                    tasks={tasks}
                    onToggleTask={handleToggleTask}
                    onOpenCreateTask={() => setIsCreateTaskOpen(true)}
                    searchFilter={searchQuery}
                  />
                </div>

                <div className="xl:col-span-1">
                  <RecentActivityList activities={activities} />
                </div>
              </div>
            </>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-6">
              <MyTasksTable
                tasks={tasks}
                onToggleTask={handleToggleTask}
                onOpenCreateTask={() => setIsCreateTaskOpen(true)}
                searchFilter={searchQuery}
              />
            </div>
          )}

          {activeTab === 'alerts' && (
            <AlertInbox
              tasks={tasks}
              onNavigateToTasks={() => setActiveTab('tasks')}
            />
          )}

          {activeTab === 'documents' && (
            <DocumentsView onOpenUpload={() => setIsUploadDocOpen(true)} />
          )}

          {activeTab === 'analytics' && <AnalyticsView />}

          {activeTab === 'team' && <TeamView />}

          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Interactive Modals */}
      <CreateTaskModal
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        onAddTask={handleAddTask}
      />

      <UploadDocumentModal
        isOpen={isUploadDocOpen}
        onClose={() => setIsUploadDocOpen(false)}
        onTasksExtracted={handleTasksExtracted}
      />

      <AskAIModal
        isOpen={isAskAIOpen}
        onClose={() => setIsAskAIOpen(false)}
      />
    </div>
  );
}
