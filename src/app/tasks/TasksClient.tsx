"use client";

import { useState, useEffect } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card } from "@/components/ui";
import { Button } from "@/components/ui";
import { Input, Textarea } from "@/components/ui";
import { Select } from "@/components/ui";
import { Modal } from "@/components/ui";
import { Badge } from "@/components/ui";
import { Toggle } from "@/components/ui";
import { Plus, Trash2, Edit2, CheckSquare, Clock, Sparkles, Sun, Moon, AlertTriangle, Shield, ChevronDown, ChevronUp, Target } from "lucide-react";
import { clsx } from "clsx";
import { format } from "date-fns";

type AISuggestions = {
  personality: "morning_person" | "night_owl" | "flexible";
  deepWorkSlots: string[];
  shallowSlots: string[];
  insight: string;
  stats: {
    totalCompleted: number;
    successRate: number;
    avgDelayMinutes: number;
    morningCompletions: number;
    eveningCompletions: number;
  };
};

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

type ResponsePlan = {
  id: string;
  challengeId: string;
  title: string;
  description: string | null;
  steps: string;
  deadline: Date | null;
  status: string;
  progress: number;
  createdAt: Date;
  completedAt: Date | null;
};

type Challenge = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
  priority: string;
  createdAt: Date;
  responsePlan: ResponsePlan | null;
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
  GENERAL: "default",
};

type BadgeVariant = "default" | "primary" | "success" | "warning" | "danger" | "info" |
  "work" | "study" | "health" | "personal" | "social" | "other";

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
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [isResponsePlanModalOpen, setIsResponsePlanModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [selectedChallengeForPlan, setSelectedChallengeForPlan] = useState<Challenge | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [expandedChallenge, setExpandedChallenge] = useState<string | null>(null);
  const [filter, setFilter] = useState<{ status: string; priority: string; category: string }>({
    status: "ALL",
    priority: "ALL",
    category: "ALL",
  });
  const [challengeFilter, setChallengeFilter] = useState<{ status: string; priority: string; category: string }>({
    status: "ALL",
    priority: "ALL",
    category: "ALL",
  });
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestions | null>(null);
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
  const [challengeFormData, setChallengeFormData] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    category: "GENERAL",
  });
  const [responsePlanFormData, setResponsePlanFormData] = useState({
    title: "",
    description: "",
    steps: "",
    deadline: "",
  });

  useEffect(() => {
    fetch("/api/ai/insights")
      .then((res) => res.json())
      .then((data) => setAiSuggestions(data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetch("/api/challenges")
      .then((res) => res.json())
      .then((data) => setChallenges(data))
      .catch(console.error);
  }, []);

  const allTasks = getAllTasks(hierarchy);

  const filteredTasks = allTasks.filter((task) => {
    if (filter.status !== "ALL" && task.status !== filter.status) return false;
    if (filter.priority !== "ALL" && task.priority !== filter.priority) return false;
    if (filter.category !== "ALL" && task.category !== filter.category) return false;
    return true;
  });

  const filteredChallenges = challenges.filter((challenge) => {
    if (challengeFilter.status !== "ALL" && challenge.status !== challengeFilter.status) return false;
    if (challengeFilter.priority !== "ALL" && challenge.priority !== challengeFilter.priority) return false;
    if (challengeFilter.category !== "ALL" && challenge.category !== challengeFilter.category) return false;
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
        if (newStatus === "COMPLETED") {
          await fetch("/api/ai/log-completion", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              taskId: task.id,
              scheduledTime: task.deadline,
            }),
          });
        }
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to update task status:", error);
    }
  };

  const handleOpenChallengeModal = (challenge?: Challenge) => {
    if (challenge) {
      setEditingChallenge(challenge);
      setChallengeFormData({
        title: challenge.title,
        description: challenge.description || "",
        priority: challenge.priority,
        category: challenge.category,
      });
    } else {
      setEditingChallenge(null);
      setChallengeFormData({
        title: "",
        description: "",
        priority: "MEDIUM",
        category: "GENERAL",
      });
    }
    setIsChallengeModalOpen(true);
  };

  const handleOpenResponsePlanModal = (challenge: Challenge) => {
    setSelectedChallengeForPlan(challenge);
    if (challenge.responsePlan) {
      setResponsePlanFormData({
        title: challenge.responsePlan.title,
        description: challenge.responsePlan.description || "",
        steps: JSON.parse(challenge.responsePlan.steps || "[]").join("\n"),
        deadline: challenge.responsePlan.deadline ? format(new Date(challenge.responsePlan.deadline), "yyyy-MM-dd") : "",
      });
    } else {
      setResponsePlanFormData({
        title: "",
        description: "",
        steps: "",
        deadline: "",
      });
    }
    setIsResponsePlanModalOpen(true);
  };

  const handleSubmitChallenge = async () => {
    if (!challengeFormData.title.trim()) return;

    try {
      const response = await fetch("/api/challenges", {
        method: editingChallenge ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingChallenge?.id,
          title: challengeFormData.title,
          description: challengeFormData.description || undefined,
          priority: challengeFormData.priority,
          category: challengeFormData.category,
        }),
      });

      if (response.ok) {
        const newChallenge = await response.json();
        if (editingChallenge) {
          setChallenges(challenges.map(c => c.id === editingChallenge.id ? { ...newChallenge, responsePlan: editingChallenge.responsePlan } : c));
        } else {
          setChallenges([{ ...newChallenge, responsePlan: null }, ...challenges]);
        }
        setIsChallengeModalOpen(false);
      }
    } catch (error) {
      console.error("Failed to save challenge:", error);
    }
  };

  const handleSubmitResponsePlan = async () => {
    if (!responsePlanFormData.title.trim()) return;

    try {
      const stepsArray = responsePlanFormData.steps.split("\n").filter(s => s.trim());
      
      if (selectedChallengeForPlan?.responsePlan) {
        const response = await fetch("/api/response-plans", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: selectedChallengeForPlan.responsePlan.id,
            title: responsePlanFormData.title,
            description: responsePlanFormData.description || undefined,
            steps: stepsArray,
            deadline: responsePlanFormData.deadline || undefined,
          }),
        });

        if (response.ok) {
          const updatedPlan = await response.json();
          setChallenges(challenges.map(c => 
            c.id === selectedChallengeForPlan.id ? { ...c, responsePlan: updatedPlan } : c
          ));
        }
      } else {
        const response = await fetch("/api/response-plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            challengeId: selectedChallengeForPlan?.id,
            title: responsePlanFormData.title,
            description: responsePlanFormData.description || undefined,
            steps: stepsArray,
            deadline: responsePlanFormData.deadline || undefined,
          }),
        });

        if (response.ok) {
          const newPlan = await response.json();
          setChallenges(challenges.map(c => 
            c.id === selectedChallengeForPlan?.id ? { ...c, responsePlan: newPlan } : c
          ));
        }
      }
      setIsResponsePlanModalOpen(false);
    } catch (error) {
      console.error("Failed to save response plan:", error);
    }
  };

  const handleDeleteChallenge = async (id: string) => {
    if (!confirm("Are you sure you want to delete this challenge?")) return;

    try {
      const response = await fetch(`/api/challenges?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setChallenges(challenges.filter(c => c.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete challenge:", error);
    }
  };

  const handleProgressUpdate = async (challenge: Challenge, progress: number) => {
    if (!challenge.responsePlan) return;

    try {
      const response = await fetch("/api/response-plans", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: challenge.responsePlan.id,
          progress,
          status: progress === 100 ? "COMPLETED" : "IN_PROGRESS",
        }),
      });

      if (response.ok) {
        const updatedPlan = await response.json();
        setChallenges(challenges.map(c => 
          c.id === challenge.id ? { ...c, responsePlan: updatedPlan } : c
        ));
      }
    } catch (error) {
      console.error("Failed to update progress:", error);
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
      description="Manage your tasks - plan tasks are linked to weekly plans, daily to-dos are independent"
      action={
        weeklyPlans.length > 0 ? (
          <>
            <Button onClick={() => handleOpenModal()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
            <Button variant="secondary" onClick={() => handleOpenChallengeModal()}>
              <Target className="w-4 h-4 mr-2" />
              Add Challenge
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={() => handleOpenChallengeModal()}>
              <Target className="w-4 h-4 mr-2" />
              Add Challenge
            </Button>
          </>
        )
      }
    >
      {aiSuggestions && (
        <div className="mb-6 p-6 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Smart Insights</h3>
            <Badge variant="primary" className="ml-auto">
              {aiSuggestions.personality === "morning_person" && (
                <span className="flex items-center gap-1"><Sun className="w-3 h-3" /> Morning Person</span>
              )}
              {aiSuggestions.personality === "night_owl" && (
                <span className="flex items-center gap-1"><Moon className="w-3 h-3" /> Night Owl</span>
              )}
              {aiSuggestions.personality === "flexible" && "Flexible"}
            </Badge>
          </div>
          <p className="text-sm text-foreground-secondary mb-4">{aiSuggestions.insight}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-background/50 rounded-lg p-3">
              <p className="text-foreground-muted mb-1">Best for Deep Work</p>
              <p className="font-medium text-primary">{aiSuggestions.deepWorkSlots.join(", ")}</p>
            </div>
            <div className="bg-background/50 rounded-lg p-3">
              <p className="text-foreground-muted mb-1">Good for Shallow Tasks</p>
              <p className="font-medium text-foreground-secondary">{aiSuggestions.shallowSlots.join(", ")}</p>
            </div>
            <div className="bg-background/50 rounded-lg p-3">
              <p className="text-foreground-muted mb-1">Success Rate</p>
              <p className="font-medium text-success">{aiSuggestions.stats.successRate}%</p>
            </div>
            <div className="bg-background/50 rounded-lg p-3">
              <p className="text-foreground-muted mb-1">Avg Delay</p>
              <p className="font-medium text-foreground-secondary">{aiSuggestions.stats.avgDelayMinutes} min</p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-2 mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Challenges & Response Plans
          </h2>
          <Button variant="secondary" size="sm" onClick={() => handleOpenChallengeModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Challenge
          </Button>
        </div>
        <div className="mb-4 flex flex-wrap gap-3">
          <Select
            value={challengeFilter.status}
            onChange={(e) => setChallengeFilter({ ...challengeFilter, status: e.target.value })}
            options={[
              { value: "ALL", label: "All Status" },
              { value: "ACTIVE", label: "Active" },
              { value: "IN_PROGRESS", label: "In Progress" },
              { value: "RESOLVED", label: "Resolved" },
            ]}
            className="w-36"
          />
          <Select
            value={challengeFilter.priority}
            onChange={(e) => setChallengeFilter({ ...challengeFilter, priority: e.target.value })}
            options={[
              { value: "ALL", label: "All Priority" },
              { value: "HIGH", label: "High" },
              { value: "MEDIUM", label: "Medium" },
              { value: "LOW", label: "Low" },
            ]}
            className="w-36"
          />
          <Select
            value={challengeFilter.category}
            onChange={(e) => setChallengeFilter({ ...challengeFilter, category: e.target.value })}
            options={[
              { value: "ALL", label: "All Categories" },
              { value: "WORK", label: "Work" },
              { value: "STUDY", label: "Study" },
              { value: "HEALTH", label: "Health" },
              { value: "PERSONAL", label: "Personal" },
              { value: "GENERAL", label: "General" },
            ]}
            className="w-40"
          />
        </div>
      </div>

      <div className="space-y-3 mb-8">
        {filteredChallenges.length > 0 ? (
          filteredChallenges.map((challenge) => (
            <Card
              key={challenge.id}
              hover
              className={clsx(
                "border-l-4 !p-4",
                priorityColors[challenge.priority],
                challenge.status === "RESOLVED" && "opacity-60"
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <AlertTriangle className={clsx(
                    "w-5 h-5 mt-0.5",
                    challenge.priority === "HIGH" ? "text-danger" :
                    challenge.priority === "MEDIUM" ? "text-warning" : "text-success"
                  )} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span
                        className={clsx(
                          "font-medium text-foreground",
                          challenge.status === "RESOLVED" && "line-through text-foreground-muted"
                        )}
                      >
                        {challenge.title}
                      </span>
                      <Badge variant={(categoryColors[challenge.category] || "default") as BadgeVariant}>{challenge.category}</Badge>
                      <Badge
                        variant={
                          challenge.priority === "HIGH"
                            ? "danger"
                            : challenge.priority === "MEDIUM"
                            ? "warning"
                            : "success"
                        }
                      >
                        {challenge.priority}
                      </Badge>
                      {challenge.status === "RESOLVED" && <Badge variant="success">Resolved</Badge>}
                    </div>
                    {challenge.description && (
                      <p className="text-sm text-foreground-muted mb-1">{challenge.description}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-foreground-muted">
                      <button
                        onClick={() => setExpandedChallenge(expandedChallenge === challenge.id ? null : challenge.id)}
                        className="flex items-center gap-1 text-primary hover:underline"
                      >
                        {expandedChallenge === challenge.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        {challenge.responsePlan ? "View Response Plan" : "Add Response Plan"}
                      </button>
                    </div>
                    
                    {expandedChallenge === challenge.id && (
                      <div className="mt-3 p-3 bg-background/50 rounded-lg border border-primary/20">
                        {challenge.responsePlan ? (
                          <>
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-sm flex items-center gap-2">
                                <Shield className="w-4 h-4 text-primary" />
                                {challenge.responsePlan.title}
                              </h4>
                              <span className="text-xs text-foreground-muted">
                                {challenge.responsePlan.progress}% complete
                              </span>
                            </div>
                            {challenge.responsePlan.description && (
                              <p className="text-xs text-foreground-muted mb-2">{challenge.responsePlan.description}</p>
                            )}
                            <div className="w-full bg-foreground/10 rounded-full h-2 mb-3">
                              <div 
                                className="bg-primary h-2 rounded-full transition-all"
                                style={{ width: `${challenge.responsePlan.progress}%` }}
                              />
                            </div>
                            <div className="space-y-1 mb-3">
                              <p className="text-xs font-medium text-foreground-secondary">Steps:</p>
                              {JSON.parse(challenge.responsePlan.steps || "[]").map((step: string, index: number) => (
                                <div key={index} className="flex items-start gap-2 text-xs">
                                  <span className="text-primary font-medium">{index + 1}.</span>
                                  <span className="text-foreground-secondary">{step}</span>
                                </div>
                              ))}
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={challenge.responsePlan.progress}
                                onChange={(e) => handleProgressUpdate(challenge, parseInt(e.target.value))}
                                className="flex-1 h-2 bg-foreground/10 rounded-lg appearance-none cursor-pointer"
                              />
                              <span className="text-xs text-foreground-muted w-8">{challenge.responsePlan.progress}%</span>
                            </div>
                            <div className="flex gap-2 mt-3">
                              <Button variant="secondary" size="sm" onClick={() => handleOpenResponsePlanModal(challenge)}>
                                <Edit2 className="w-3 h-3 mr-1" />
                                Edit Plan
                              </Button>
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-4">
                            <Shield className="w-8 h-8 mx-auto text-foreground-muted mb-2" />
                            <p className="text-sm text-foreground-muted mb-2">No response plan yet</p>
                            <Button variant="secondary" size="sm" onClick={() => handleOpenResponsePlanModal(challenge)}>
                              <Plus className="w-3 h-3 mr-1" />
                              Create Response Plan
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleOpenChallengeModal(challenge)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteChallenge(challenge.id)}>
                    <Trash2 className="w-4 h-4 text-danger" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="text-center py-8">
            <AlertTriangle className="w-10 h-10 mx-auto text-foreground-muted mb-3" />
            <p className="text-foreground-muted mb-3">No challenges yet.</p>
            <Button variant="secondary" size="sm" onClick={() => handleOpenChallengeModal()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Challenge
            </Button>
          </Card>
        )}
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Plan Tasks</h2>
      </div>

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
                      <Badge variant={(categoryColors[task.category] || "default") as BadgeVariant}>{task.category}</Badge>
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

      <Modal
        isOpen={isChallengeModalOpen}
        onClose={() => setIsChallengeModalOpen(false)}
        title={editingChallenge ? "Edit Challenge" : "Create New Challenge"}
      >
        <div className="space-y-4">
          <Input
            label="Challenge Title"
            value={challengeFormData.title}
            onChange={(e) => setChallengeFormData({ ...challengeFormData, title: e.target.value })}
            placeholder="e.g., Procrastination, Time Management Issues"
          />
          <Textarea
            label="Description"
            value={challengeFormData.description}
            onChange={(e) => setChallengeFormData({ ...challengeFormData, description: e.target.value })}
            placeholder="Describe the challenge you're facing..."
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Priority"
              value={challengeFormData.priority}
              onChange={(e) => setChallengeFormData({ ...challengeFormData, priority: e.target.value })}
              options={[
                { value: "HIGH", label: "High" },
                { value: "MEDIUM", label: "Medium" },
                { value: "LOW", label: "Low" },
              ]}
            />
            <Select
              label="Category"
              value={challengeFormData.category}
              onChange={(e) => setChallengeFormData({ ...challengeFormData, category: e.target.value })}
              options={[
                { value: "WORK", label: "Work" },
                { value: "STUDY", label: "Study" },
                { value: "HEALTH", label: "Health" },
                { value: "PERSONAL", label: "Personal" },
                { value: "GENERAL", label: "General" },
              ]}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsChallengeModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitChallenge}>
              {editingChallenge ? "Save Changes" : "Create Challenge"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isResponsePlanModalOpen}
        onClose={() => setIsResponsePlanModalOpen(false)}
        title="Response Plan"
      >
        <div className="space-y-4">
          <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg mb-4">
            <p className="text-sm text-primary font-medium">Challenge: {selectedChallengeForPlan?.title}</p>
          </div>
          <Input
            label="Plan Title"
            value={responsePlanFormData.title}
            onChange={(e) => setResponsePlanFormData({ ...responsePlanFormData, title: e.target.value })}
            placeholder="e.g., Action Plan to Overcome Procrastination"
          />
          <Textarea
            label="Description"
            value={responsePlanFormData.description}
            onChange={(e) => setResponsePlanFormData({ ...responsePlanFormData, description: e.target.value })}
            placeholder="Describe your response plan..."
          />
          <Textarea
            label="Steps (one per line)"
            value={responsePlanFormData.steps}
            onChange={(e) => setResponsePlanFormData({ ...responsePlanFormData, steps: e.target.value })}
            placeholder="Break down your plan into actionable steps&#10;1. First step&#10;2. Second step&#10;3. Third step"
            rows={6}
          />
          <Input
            label="Deadline (Optional)"
            type="date"
            value={responsePlanFormData.deadline}
            onChange={(e) => setResponsePlanFormData({ ...responsePlanFormData, deadline: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsResponsePlanModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitResponsePlan}>
              {selectedChallengeForPlan?.responsePlan ? "Save Changes" : "Create Response Plan"}
            </Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}
