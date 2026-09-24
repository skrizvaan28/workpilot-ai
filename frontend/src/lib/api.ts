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
      ...(options.headers as Record<string, string> | undefined),
    },
  });

  if (!res.ok) {
    // On 401 (except during login), clear the stored token and notify AuthContext
    if (res.status === 401 && !path.startsWith("/auth/login")) {
      clearToken();
      window.dispatchEvent(new CustomEvent("workpilot:unauthorized"));
    }

    const body = await res.json().catch(() => ({ detail: "Request failed" }));
    let message = "Request failed";
    if (typeof body.detail === "string") {
      message = body.detail;
    } else if (Array.isArray(body.detail) && body.detail.length > 0) {
      // FastAPI validation errors are arrays of objects with a "msg" field
      message = (body.detail as { msg: string }[])
        .map((item) => item.msg ?? JSON.stringify(item))
        .join(", ");
    } else if (typeof body.message === "string") {
      message = body.message;
    }
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

export interface KnowledgeDocument {
  id: string;
  user_id: string;
  title: string;
  filename: string;
  document_type: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeDocumentChunk {
  id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  char_count: number;
  token_estimate: number;
  embedding_status: string;
  embedding_model: string | null;
  created_at: string;
}

export interface KnowledgeDocumentChunkResponse {
  document_id: string;
  total_chunks: number;
  chunks: KnowledgeDocumentChunk[];
}

export interface SemanticSearchResult {
  document_id: string;
  title: string;
  filename: string;
  chunk_index: number;
  content: string;
  similarity: number;
  embedding_model: string;
}

export interface SemanticSearchResponse {
  query: string;
  results: SemanticSearchResult[];
}

export interface KnowledgeDocumentSource {
  document_id: string;
  title: string;
  filename: string;
  chunk_index: number;
  content: string;
  similarity: number;
  embedding_model: string;
}

export interface KnowledgeDocumentAskResponse {
  query: string;
  answer: string;
  sources: KnowledgeDocumentSource[];
  context_found: boolean;
  total_sources: number;
  top_similarity: number | null;
}

export interface TaskCopilotKnowledgeSource {
  document_id: string;
  title: string;
  filename: string;
  chunk_index: number;
  content: string;
  similarity: number;
  embedding_model: string;
}

export interface TaskCopilotResponse {
  answer: string;
  suggested_steps: string[];
  checklist: string[];
  blockers: string[];
  recommended_priority: string | null;
  recommended_deadline: string | null;
  knowledge_context_found: boolean;
  knowledge_sources: TaskCopilotKnowledgeSource[];
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
  taskCopilot: (taskId: string, payload: { action: string; question?: string }) =>
    request<TaskCopilotResponse>(`/ai/tasks/${taskId}/copilot`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  extractDocumentTasks: (content: string) =>
    request<{ tasks: ExtractedTask[] }>("/ai/documents/tasks", {
      method: "POST",
      body: JSON.stringify({ content }),
    }),
  rewardsOverview: () => request<RewardsOverview>("/rewards/overview"),
  analyticsOverview: () => request<AnalyticsOverview>("/analytics/overview"),
  knowledgeDocuments: () => request<KnowledgeDocument[]>("/knowledge-documents"),
  createKnowledgeDocument: (payload: {
    title: string;
    filename: string;
    document_type: string;
    content: string;
  }) =>
    request<KnowledgeDocument>("/knowledge-documents", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getKnowledgeDocument: (documentId: string) =>
    request<KnowledgeDocument>(`/knowledge-documents/${documentId}`),
  deleteKnowledgeDocument: (documentId: string) =>
    request<void>(`/knowledge-documents/${documentId}`, { method: "DELETE" }),
  getKnowledgeDocumentChunks: (documentId: string) =>
    request<KnowledgeDocumentChunkResponse>(`/knowledge-documents/${documentId}/chunks`),
  semanticSearch: (payload: { query: string; top_k?: number }) =>
    request<SemanticSearchResponse>("/knowledge-documents/search", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  askKnowledgeBase: (payload: { query: string; top_k?: number }) =>
    request<KnowledgeDocumentAskResponse>("/knowledge-documents/ask", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
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

