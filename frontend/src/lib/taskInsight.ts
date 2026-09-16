import { useCallback, useEffect, useState } from "react";
import { api, TaskInsightResult } from "./api";
import { Task } from "../types/dashboard";

const insightCache = new Map<string, TaskInsightResult>();

function cacheKey(task: Task) {
  return `${task.id}:${task.progress}:${task.status}:${task.dueDate}:${task.priority}:${task.urgency}`;
}

export function taskToInsightPayload(task: Task) {
  return {
    title: task.title,
    description: task.aiReasoning || "",
    priority: task.priority,
    category: task.category,
    due_date: task.dueDate,
    progress: task.progress,
    assignee: task.assignee?.name ?? "",
    urgency: task.urgency,
    completed: task.status === "completed",
    status: task.status,
  };
}

export function useTaskInsight(task: Task | null, enabled = true) {
  const key = task && enabled ? cacheKey(task) : "";
  const [insight, setInsight] = useState<TaskInsightResult | null>(
    key ? insightCache.get(key) ?? null : null
  );
  const [loading, setLoading] = useState(Boolean(key && !insightCache.has(key)));
  const [error, setError] = useState<string | null>(null);

  const fetchInsight = useCallback(
    async (force = false) => {
      if (!task || !enabled || !key) return;
      if (!force && insightCache.has(key)) {
        setInsight(insightCache.get(key) ?? null);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const result = await api.taskInsight(taskToInsightPayload(task));
        insightCache.set(key, result);
        setInsight(result);
      } catch (err) {
        setInsight(null);
        setError(
          err instanceof Error
            ? err.message
            : "AI insight temporarily unavailable. Please try again."
        );
      } finally {
        setLoading(false);
      }
    },
    [enabled, key, task]
  );

  useEffect(() => {
    if (!task || !enabled || !key) return;
    void fetchInsight(false);
  }, [task, enabled, key, fetchInsight]);

  const retry = useCallback(() => {
    void fetchInsight(true);
  }, [fetchInsight]);

  return { insight, loading, error, retry };
}
