export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'in_progress' | 'pending' | 'completed' | 'overdue';
export type TaskUrgency = 'overdue' | 'due_today' | 'upcoming' | 'none';

export interface Task {
  id: string;
  title: string;
  category: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  progress: number;
  aiPriorityScore: number;
  aiReasoning: string;
  urgency: TaskUrgency;
  assignee?: {
    name: string;
    avatar: string;
  };
}

export interface MetricCardData {
  title: string;
  value: string | number;
  change: string;
  isPositive: boolean;
  subtitle: string;
  iconName: string;
}

export interface AIInsight {
  id: string;
  type: 'urgent' | 'recommendation' | 'improvement' | 'efficiency';
  headline: string;
  description: string;
  badgeText: string;
  impactScore?: string;
  actionText?: string;
}

export interface RecentActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'ai_agent' | 'task' | 'document' | 'productivity' | 'system';
  icon: string;
}

export interface DailyProductivity {
  day: string;
  score: number;
  completedTasks: number;
  plannedTasks: number;
  focusHours: number;
}

export interface TaskInsight {
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  deadline_risk: 'HIGH' | 'MEDIUM' | 'LOW';
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  estimated_effort: 'Low' | 'Medium' | 'High';
  completion_status: string;
  recommended_action: string;
  explanation: string;
  risk_level: 'low' | 'medium' | 'high';
  risk_score: number;
  insight: string;
  reason: string;
  suggested_priority: 'low' | 'medium' | 'high';
  likely_overdue: boolean;
}

