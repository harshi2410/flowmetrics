"use client";

import { useState, useEffect } from "react";

export interface Task {
  id: string;
  project_id: string;
  project_key?: string;
  task_number: number;
  title: string;
  description: string | null;
  status: "to_do" | "in_progress" | "in_review" | "blocked" | "done";
  priority: "critical" | "high" | "medium" | "low";
  assignee_id: string | null;
  assignee_name?: string;
  estimated_hours: number;
  actual_hours: number;
  due_date: string | null;
  labels: string[];
}

const COLUMNS: { id: Task["status"]; label: string; icon: string; border: string }[] = [
  { id: "to_do", label: "To Do", icon: "📋", border: "border-slate-500/20" },
  { id: "in_progress", label: "In Progress", icon: "⚡", border: "border-blue-500/30" },
  { id: "in_review", label: "In Review", icon: "🔍", border: "border-purple-500/30" },
  { id: "done", label: "Done", icon: "✅", border: "border-emerald-500/30" },
];

export function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<Task["priority"]>("medium");
  const [newTaskHours, setNewTaskHours] = useState(4);

  const getHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("flowmetrics_token") || "" : "";
    const currentOrg = typeof window !== "undefined" ? localStorage.getItem("flowmetrics_current_org") : null;
    const orgId = currentOrg ? JSON.parse(currentOrg).id : "flowmetrics-hq-id";
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-Organization-Id": orgId,
    };
  };

  const loadTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/operations/tasks", { credentials: "include", headers: getHeaders() });
      if (!res.ok) {
        setError("Failed to fetch live tasks from server.");
        setTasks([]);
        return;
      }
      const data = await res.json();
      setTasks(data.data || []);
    } catch (err) {
      console.error("Failed to load tasks:", err);
      setError("Failed to fetch live tasks from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleStatusChange = async (taskId: string, newStatus: Task["status"]) => {
    // Optimistic update
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
    try {
      await fetch(`/api/operations/tasks/${taskId}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      // Reload on error
      loadTasks();
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const res = await fetch("/api/operations/tasks", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          projectId: "proj-flow-core",
          title: newTaskTitle,
          priority: newTaskPriority,
          status: "to_do",
          estimatedHours: newTaskHours,
          labels: ["ops"],
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setTasks((prev) => [json.data, ...prev]);
        setNewTaskTitle("");
        setIsCreating(false);
      }
    } catch {
      // fallback
      const tempTask: Task = {
        id: "task-" + Date.now(),
        project_id: "p1",
        project_key: "FLOW",
        task_number: Math.floor(100 + Math.random() * 900),
        title: newTaskTitle,
        description: null,
        status: "to_do",
        priority: newTaskPriority,
        assignee_id: null,
        assignee_name: "Unassigned",
        estimated_hours: newTaskHours,
        actual_hours: 0,
        due_date: null,
        labels: ["ops"],
      };
      setTasks((prev) => [tempTask, ...prev]);
      setNewTaskTitle("");
      setIsCreating(false);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesPriority = filterPriority === "all" || t.priority === filterPriority;
    const matchesSearch =
      search === "" ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.assignee_name && t.assignee_name.toLowerCase().includes(search.toLowerCase()));
    return matchesPriority && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Controls & Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search tasks, assignees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-line bg-ink px-3 py-1.5 text-xs text-text placeholder-muted focus:border-signal focus:outline-none"
          />

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="rounded-lg border border-line bg-ink px-3 py-1.5 text-xs text-text focus:border-signal focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <button
            onClick={loadTasks}
            className="rounded-lg border border-line bg-ink px-2.5 py-1.5 text-xs text-muted hover:text-text transition-colors"
            title="Refresh board"
          >
            🔄
          </button>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="rounded-lg bg-signal px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:opacity-90 transition-opacity flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span>➕</span>
          <span>Create Task</span>
        </button>
      </div>

      {/* Creation Modal / Form */}
      {isCreating && (
        <form
          onSubmit={handleCreateTask}
          className="rounded-xl border border-line bg-surface p-4 shadow-lg space-y-3 animate-in fade-in duration-200"
        >
          <div className="text-xs font-semibold uppercase tracking-wider text-signal">
            Add New Operational Task
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Task Title (e.g. Optimize Redis Connection Pool)"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="sm:col-span-2 rounded-lg border border-line bg-ink px-3 py-2 text-xs text-text placeholder-muted focus:border-signal focus:outline-none"
              required
            />
            <div className="flex gap-2">
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value as any)}
                className="flex-1 rounded-lg border border-line bg-ink px-2 py-2 text-xs text-text focus:border-signal"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <input
                type="number"
                min="1"
                max="100"
                value={newTaskHours}
                onChange={(e) => setNewTaskHours(Number(e.target.value))}
                placeholder="Hours"
                className="w-16 rounded-lg border border-line bg-ink px-2 py-2 text-xs text-text text-center focus:border-signal"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="rounded-lg border border-line px-3 py-1.5 text-xs text-muted hover:text-text"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-signal px-3.5 py-1.5 text-xs font-semibold text-white hover:opacity-90"
            >
              Save Task
            </button>
          </div>
        </form>
      )}

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {COLUMNS.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.id);
          return (
            <div
              key={col.id}
              className={`rounded-xl border ${col.border} bg-surface/70 flex flex-col min-h-[500px] shadow-sm`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between border-b border-line px-3.5 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{col.icon}</span>
                  <span className="text-xs font-semibold text-text uppercase tracking-wider">
                    {col.label}
                  </span>
                </div>
                <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] font-mono text-muted">
                  {colTasks.length}
                </span>
              </div>

              {/* Task Cards */}
              <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[75vh]">
                {colTasks.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-line/60 p-6 text-center text-xs text-muted">
                    No tasks in {col.label.toLowerCase()}
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <div
                      key={task.id}
                      className="group rounded-lg border border-line bg-surface p-3.5 shadow-sm hover:border-signal/50 transition-all space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-mono text-[10px] text-muted">
                          {task.project_key || "FLOW"}-{task.task_number}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                            task.priority === "critical"
                              ? "bg-rose-500/15 text-rose-400"
                              : task.priority === "high"
                              ? "bg-amber-500/15 text-amber-400"
                              : task.priority === "medium"
                              ? "bg-blue-500/15 text-blue-400"
                              : "bg-slate-500/15 text-slate-400"
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>

                      <h4 className="text-xs font-medium text-text leading-snug line-clamp-2">
                        {task.title}
                      </h4>

                      {task.description && (
                        <p className="text-[11px] text-muted line-clamp-2 leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      {/* Hours Progress */}
                      {task.estimated_hours > 0 && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-muted">
                            <span>Logged: {task.actual_hours}h</span>
                            <span>Est: {task.estimated_hours}h</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-ink overflow-hidden">
                            <div
                              className="h-full bg-signal transition-all"
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.round((task.actual_hours / task.estimated_hours) * 100)
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Card Footer: Assignee & Quick Status Change */}
                      <div className="flex items-center justify-between border-t border-line/50 pt-2 text-[10px] text-muted">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-block h-4 w-4 rounded-full bg-signal/20 text-center font-bold text-signal text-[9px] leading-4">
                            {(task.assignee_name || "U")[0]}
                          </span>
                          <span className="truncate max-w-[80px]">
                            {task.assignee_name || "Unassigned"}
                          </span>
                        </div>

                        {/* Move Status Dropdown */}
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value as any)}
                          className="rounded border border-line bg-ink px-1.5 py-0.5 text-[10px] text-text focus:border-signal"
                        >
                          <option value="to_do">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="in_review">In Review</option>
                          <option value="done">Done</option>
                        </select>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
