"use client";

import { useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card } from "@/components/ui";
import { Button } from "@/components/ui";
import { Input, Textarea } from "@/components/ui";
import { Select } from "@/components/ui";
import { Modal } from "@/components/ui";
import { Badge } from "@/components/ui";
import { Toggle } from "@/components/ui";
import { Plus, Trash2, Edit2, CheckSquare, Clock, Filter } from "lucide-react";
import { clsx } from "clsx";
import { format } from "date-fns";

type Task = {
  id: string;
  weeklyPlanId: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  effortValue: number;
  deadline: Date | null;
  notes: string | null;
  category: string;
  isRecurring: boolean;
  createdAt: Date;
  completedAt: Date | null;
};

type WeeklyPlan = {
  id: string;
  monthlyGoalId: string;
  title: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
  notes: string | null;
  status: string;
  tasks: Task[];
};

type MonthlyGoal = {
  id: string;
  yearlyGoalId: string;
  title: string;
  monthlyGoal?: MonthlyGoal;
  weeklyPlans: WeeklyPlan[];
};

type YearlyGoal = {
  id: string;
  title: string;
  monthlyGoals: MonthlyGoal[];
};

type HierarchicalData = YearlyGoal[];

interface TasksClientProps {
  userId: string;
  initialHierarchy: HierarchicalData;
  weeklyPlans: WeeklyPlan[];
}

const priorityColors: Record<string, string> = {
  HIGH: "border-l-danger",
  MEDIUM: "border-l-warning",
  LOW: "border-l-success",
};

const categoryColors: Record<string, string> = {
  WORK: "work",
  STUDY: "study",
  HEALTH: "health",
  PERSONAL: "personal",
  SOCIAL: "social",
  OTHER: "other",
};

function getAllTasks(hierarchy: HierarchicalData): Task[] {
  return hierarchy.flatMap(yg => 
    yg.monthlyGoals.flatMap(mg => 
      mg.weeklyPlans.flatMap(wp => wp.tasks)
    )
  );
}

export function TasksClient({ userId, initialHierarchy, weeklyPlans }: TasksClientProps) {
  const [hierarchy, setHierarchy] = useState<HierarchicalData>(initialHierarchy);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<{ status: string; priority: string; category: string }>({
    status: "ALL",
    priority: "ALL",
    category: "ALL",
  });
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    status: "PENDING",
    category: "OTHER",
    deadline: "",
    weeklyPlanId: "",
    isRecurring: false,
    effortValue: 1,
  });

  const allTasks = getAllTasks(hierarchy);

  const filteredTasks = allTasks.filter((task) => {
    if (filter.status !== "ALL" && task.status !== filter.status) return false;
    if (filter.priority !== "ALL" && task.priority !== filter.priority) return false;
    if (filter.category !== "ALL" && task.category !== filter.category) return false;
    return true;
  });

  const handleOpenModal = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        title: task.title,
        description: task.description || "",
        priority: task.priority,
        status: task.status,
        category: task.category,
        deadline: task.deadline ? format(new Date(task.deadline), "yyyy-MM-dd") : "",
        weeklyPlanId: task.weeklyPlanId,
        isRecurring: task.isRecurring,
        effortValue: task.effortValue,
      });
    } else {
      setEditingTask(null);
      setFormData({
        title: "",
        description: "",
        priority: "MEDIUM",
        status: "PENDING",
        category: "OTHER",
        deadline: "",
        weeklyPlanId: weeklyPlans.length > 0 ? weeklyPlans[0].id : "",
        isRecurring: false,
        effortValue: 1,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) return;
    if (!formData.weeklyPlanId) {
      alert("Please select a weekly plan first. Create a goal hierarchy from the Goals page.");
      return;
    }

    try {
      const response = await fetch("/api/hierarchy/tasks", {
        method: editingTask ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingTask?.id,
          weeklyPlanId: formData.weeklyPlanId,
          title: formData.title,
          description: formData.description || undefined,
          priority: formData.priority,
          status: formData.status,
          category: formData.category,
          deadline: formData.deadline ? new Date(formData.deadline) : undefined,
          isRecurring: formData.isRecurring,
          effortValue: formData.effortValue,
        }),
      });

      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to save task:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      const response = await fetch(`/api/hierarchy/tasks?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  const handleStatusToggle = async (task: Task) => {
    const newStatus = task.status === "COMPLETED" ? "PENDING" : "COMPLETED";

    try {
      const response = await fetch("/api/hierarchy/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: task.id,
          status: newStatus,
        }),
      });

      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to update task status:", error);
    }
  };

  const getWeeklyPlanTitle = (weeklyPlanId: string) => {
    const wp = weeklyPlans.find(w => w.id === weeklyPlanId);
    return wp?.title || "Unknown";
  };

  const getBreadcrumb = (weeklyPlanId: string) => {
    for (const yg of hierarchy) {
      for (const mg of yg.monthlyGoals) {
        const wp = mg.weeklyPlans.find(w => w.id === weeklyPlanId);
        if (wp) {
          return `${yg.title} > ${mg.title}`;
        }
      }
    }
    return "";
  };

  return (
    <PageContainer
      title="Tasks"
      description="Manage your tasks - all tasks must be linked to a weekly plan"
      action={
        weeklyPlans.length > 0 ? (
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        ) : (
          <Button disabled>
            Create a Weekly Plan First
          </Button>
        )
      }
    >
      {weeklyPlans.length === 0 && (
        <div className="mb-6 p-4 bg-warning/10 border border-warning/20 rounded-lg">
          <p className="text-warning font-medium">
            No weekly plans found. Please create a goal hierarchy (Yearly Goal → Monthly Goal → Weekly Plan) from the Goals page before adding tasks.
          </p>
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-3">
        <Select
          value={filter.status}
          onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          options={[
            { value: "ALL", label: "All Status" },
            { value: "PENDING", label: "Pending" },
            { value: "IN_PROGRESS", label: "In Progress" },
            { value: "COMPLETED", label: "Completed" },
          ]}
          className="w-36"
        />
        <Select
          value={filter.priority}
          onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
          options={[
            { value: "ALL", label: "All Priority" },
            { value: "HIGH", label: "High" },
            { value: "MEDIUM", label: "Medium" },
            { value: "LOW", label: "Low" },
          ]}
          className="w-36"
        />
        <Select
          value={filter.category}
          onChange={(e) => setFilter({ ...filter, category: e.target.value })}
          options={[
            { value: "ALL", label: "All Categories" },
            { value: "WORK", label: "Work" },
            { value: "STUDY", label: "Study" },
            { value: "HEALTH", label: "Health" },
            { value: "PERSONAL", label: "Personal" },
            { value: "SOCIAL", label: "Social" },
            { value: "OTHER", label: "Other" },
          ]}
          className="w-40"
        />
      </div>

      <div className="space-y-3">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <Card
              key={task.id}
              hover
              className={clsx(
                "border-l-4 !p-4",
                priorityColors[task.priority],
                task.status === "COMPLETED" && "opacity-60"
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <button
                    onClick={() => handleStatusToggle(task)}
                    className={clsx(
                      "mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                      task.status === "COMPLETED"
                        ? "bg-success border-success text-white"
                        : "border-foreground-muted hover:border-primary"
                    )}
                  >
                    {task.status === "COMPLETED" && <CheckSquare className="w-3 h-3" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span
                        className={clsx(
                          "font-medium text-foreground",
                          task.status === "COMPLETED" && "line-through text-foreground-muted"
                        )}
                      >
                        {task.title}
                      </span>
                      <Badge variant={categoryColors[task.category] as any}>{task.category}</Badge>
                      <Badge
                        variant={
                          task.priority === "HIGH"
                            ? "danger"
                            : task.priority === "MEDIUM"
                            ? "warning"
                            : "success"
                        }
                      >
                        {task.priority}
                      </Badge>
                      {task.status === "COMPLETED" && <Badge variant="success">Done</Badge>}
                    </div>
                    {task.description && (
                      <p className="text-sm text-foreground-muted mb-1">{task.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-foreground-muted">
                      {task.deadline && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(task.deadline), "MMM d")}
                        </span>
                      )}
                      <span className="text-primary">
                        {getBreadcrumb(task.weeklyPlanId)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleOpenModal(task)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(task.id)}>
                    <Trash2 className="w-4 h-4 text-danger" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="text-center py-12">
            <CheckSquare className="w-12 h-12 mx-auto text-foreground-muted mb-4" />
            <p className="text-foreground-muted mb-4">No tasks found.</p>
            {weeklyPlans.length > 0 && (
              <Button onClick={() => handleOpenModal()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            )}
          </Card>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTask ? "Edit Task" : "Create New Task"}
      >
        <div className="space-y-4">
          <Input
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Enter task title"
          />
          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter task description"
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Priority"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              options={[
                { value: "HIGH", label: "High" },
                { value: "MEDIUM", label: "Medium" },
                { value: "LOW", label: "Low" },
              ]}
            />
            <Select
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              options={[
                { value: "WORK", label: "Work" },
                { value: "STUDY", label: "Study" },
                { value: "HEALTH", label: "Health" },
                { value: "PERSONAL", label: "Personal" },
                { value: "SOCIAL", label: "Social" },
                { value: "OTHER", label: "Other" },
              ]}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { value: "PENDING", label: "Pending" },
                { value: "IN_PROGRESS", label: "In Progress" },
                { value: "COMPLETED", label: "Completed" },
              ]}
            />
            <Input
              label="Effort Value"
              type="number"
              min={1}
              max={10}
              value={formData.effortValue}
              onChange={(e) => setFormData({ ...formData, effortValue: parseInt(e.target.value) || 1 })}
            />
          </div>
          <Select
            label="Weekly Plan (Required)"
            value={formData.weeklyPlanId}
            onChange={(e) => setFormData({ ...formData, weeklyPlanId: e.target.value })}
            options={weeklyPlans.map(wp => ({ value: wp.id, label: wp.title }))}
          />
          <Input
            label="Deadline"
            type="date"
            value={formData.deadline}
            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
          />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground-secondary">Recurring Task</span>
            <Toggle
              checked={formData.isRecurring}
              onChange={(checked) => setFormData({ ...formData, isRecurring: checked })}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingTask ? "Save Changes" : "Create Task"}
            </Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}
