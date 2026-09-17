const TOKEN_KEY = "workpilot_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

const API_BASE_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE_URL}/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: "Request failed" }));
    const detail = body.detail;
    const message =
      typeof detail === "string"
        ? detail
        : "AI insight temporarily unavailable. Please try again.";
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface Task {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  due_date: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaskAnalysis {
  task_id: string;
  summary: string;
  suggested_priority: "low" | "medium" | "high";
  estimated_effort: "Low" | "Medium" | "High";
  suggested_subtasks: string[];
  suggested_deadline: string;
  potential_blockers: string[];
  recommended_next_action: string;
}

export interface ExtractedTask {
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  due_date: string | null;
  estimated_effort: "Low" | "Medium" | "High";
}

export interface RewardsOverview {
  total_points: number;
  current_streak: number;
  longest_streak: number;
  tasks_completed_today: number;
  total_completed_tasks: number;
  unlocked_badges: string[];
}

export interface WeeklyProductivityPoint {
  day: string;
  date: string;
  completed_tasks: number;
}

export interface AnalyticsOverview {
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  overdue_tasks: number;
  completion_rate: number;
  high_priority_tasks: number;
  medium_priority_tasks: number;
  low_priority_tasks: number;
  tasks_completed_today: number;
  tasks_completed_this_week: number;
  current_streak: number;
  longest_streak: number;
  productivity_points: number;
  weekly_productivity: WeeklyProductivityPoint[];
}

export const api = {
  register: (full_name: string, email: string, password: string) =>
    request<UserProfile>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ full_name, email, password }),
    }),

  login: (email: string, password: string) =>
    request<{ access_token: string; token_type: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  me: () => request<UserProfile>("/users/me"),
  tasks: () => request<Task[]>("/tasks"),
  createTask: (payload: Pick<Task, "title" | "description" | "priority" | "due_date">) =>
    request<Task>("/tasks", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateTask: (taskId: string, payload: Partial<Pick<Task, "title" | "description" | "priority" | "due_date">>) =>
    request<Task>(`/tasks/${taskId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteTask: (taskId: string) =>
    request<void>(`/tasks/${taskId}`, { method: "DELETE" }),
  completeTask: (taskId: string) =>
    request<Task>(`/tasks/${taskId}/complete`, { method: "PATCH" }),
  health: () => request<{ status: string; environment?: string }>("/health"),

  taskInsight: (payload: TaskInsightPayload) =>
    request<TaskInsightResult>("/ai/task-insight", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  analyzeTask: (taskId: string) =>
    request<TaskAnalysis>(`/ai/tasks/${taskId}/analyze`, { method: "POST" }),
  extractDocumentTasks: (content: string) =>
    request<{ tasks: ExtractedTask[] }>("/ai/documents/tasks", {
      method: "POST",
      body: JSON.stringify({ content }),
    }),
  rewardsOverview: () => request<RewardsOverview>("/rewards/overview"),
  analyticsOverview: () => request<AnalyticsOverview>("/analytics/overview"),
};

export interface TaskInsightPayload {
  title: string;
  description: string;
  priority: string;
  category: string;
  due_date: string;
  progress: number;
  assignee: string;
  urgency: string;
  completed: boolean;
  status?: string;
}

export interface TaskInsightResult {
  priority: "HIGH" | "MEDIUM" | "LOW";
  deadline_risk: "HIGH" | "MEDIUM" | "LOW";
  urgency: "HIGH" | "MEDIUM" | "LOW";
  estimated_effort: "Low" | "Medium" | "High";
  completion_status: string;
  recommended_action: string;
  explanation: string;
  risk_level: "low" | "medium" | "high";
  risk_score: number;
  insight: string;
  reason: string;
  suggested_priority: "low" | "medium" | "high";
  likely_overdue: boolean;
}

