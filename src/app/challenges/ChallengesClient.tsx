"use client";

import { useState, useEffect, useCallback } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card } from "@/components/ui";
import { Button } from "@/components/ui";
import { Input, Textarea } from "@/components/ui";
import { Select } from "@/components/ui";
import { Modal } from "@/components/ui";
import { Badge } from "@/components/ui";
import { Plus, Trash2, Edit2, Target, CheckSquare, Clock, ChevronDown, ChevronUp, Flag } from "lucide-react";
import { clsx } from "clsx";
import { format } from "date-fns";

type Challenge = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
  priority: string;
  createdAt: Date;
  updatedAt: Date;
  responsePlan: ResponsePlan | null;
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
  updatedAt: Date;
  completedAt: Date | null;
};

interface ChallengesClientProps {
  userId: string;
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
  GENERAL: "default",
};

const statusColors: Record<string, string> = {
  ACTIVE: "bg-primary/10 text-primary",
  COMPLETED: "bg-success/10 text-success",
  ARCHIVED: "bg-foreground-muted/10 text-foreground-muted",
};

export function ChallengesClient({ userId }: ChallengesClientProps) {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [isResponsePlanModalOpen, setIsResponsePlanModalOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [expandedChallenges, setExpandedChallenges] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState({ status: "ALL", category: "ALL", priority: "ALL" });

  const [challengeForm, setChallengeForm] = useState({
    title: "",
    description: "",
    category: "GENERAL",
    priority: "MEDIUM",
  });

  const [responsePlanForm, setResponsePlanForm] = useState({
    title: "",
    description: "",
    steps: "",
    deadline: "",
  });

  const fetchChallenges = useCallback(async () => {
    try {
      const response = await fetch("/api/challenges");
      if (response.ok) {
        const data = await response.json();
        setChallenges(data);
      }
    } catch (error) {
      console.error("Failed to fetch challenges:", error);
    }
  }, []);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  const filteredChallenges = challenges.filter((challenge) => {
    if (filter.status !== "ALL" && challenge.status !== filter.status) return false;
    if (filter.category !== "ALL" && challenge.category !== filter.category) return false;
    if (filter.priority !== "ALL" && challenge.priority !== filter.priority) return false;
    return true;
  });

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedChallenges);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedChallenges(newExpanded);
  };

  const handleOpenChallengeModal = (challenge?: Challenge) => {
    if (challenge) {
      setEditingChallenge(challenge);
      setChallengeForm({
        title: challenge.title,
        description: challenge.description || "",
        category: challenge.category,
        priority: challenge.priority,
      });
    } else {
      setEditingChallenge(null);
      setChallengeForm({
        title: "",
        description: "",
        category: "GENERAL",
        priority: "MEDIUM",
      });
    }
    setIsChallengeModalOpen(true);
  };

  const handleOpenResponsePlanModal = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    if (challenge.responsePlan) {
      const steps = typeof challenge.responsePlan.steps === "string" 
        ? JSON.parse(challenge.responsePlan.steps).join("\n") 
        : challenge.responsePlan.steps;
      setResponsePlanForm({
        title: challenge.responsePlan.title,
        description: challenge.responsePlan.description || "",
        steps: Array.isArray(steps) ? steps.join("\n") : steps,
        deadline: challenge.responsePlan.deadline 
          ? format(new Date(challenge.responsePlan.deadline), "yyyy-MM-dd") 
          : "",
      });
    } else {
      setResponsePlanForm({
        title: "",
        description: "",
        steps: "",
        deadline: "",
      });
    }
    setIsResponsePlanModalOpen(true);
  };

  const handleSubmitChallenge = async () => {
    if (!challengeForm.title.trim()) return;

    try {
      const response = await fetch("/api/challenges", {
        method: editingChallenge ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingChallenge?.id,
          ...challengeForm,
        }),
      });

      if (response.ok) {
        fetchChallenges();
        setIsChallengeModalOpen(false);
      }
    } catch (error) {
      console.error("Failed to save challenge:", error);
    }
  };

  const handleDeleteChallenge = async (id: string) => {
    if (!confirm("Delete this challenge and its response plan?")) return;

    try {
      const response = await fetch(`/api/challenges?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchChallenges();
      }
    } catch (error) {
      console.error("Failed to delete challenge:", error);
    }
  };

  const handleSubmitResponsePlan = async () => {
    if (!responsePlanForm.title.trim() || !selectedChallenge) return;

    const stepsArray = responsePlanForm.steps
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    try {
      if (selectedChallenge.responsePlan) {
        await fetch("/api/response-plans", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: selectedChallenge.responsePlan.id,
            title: responsePlanForm.title,
            description: responsePlanForm.description || undefined,
            steps: stepsArray,
            deadline: responsePlanForm.deadline || undefined,
          }),
        });
      } else {
        await fetch("/api/response-plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            challengeId: selectedChallenge.id,
            title: responsePlanForm.title,
            description: responsePlanForm.description || undefined,
            steps: stepsArray,
            deadline: responsePlanForm.deadline || undefined,
          }),
        });
      }
      fetchChallenges();
      setIsResponsePlanModalOpen(false);
    } catch (error) {
      console.error("Failed to save response plan:", error);
    }
  };

  const handleDeleteResponsePlan = async (id: string) => {
    if (!confirm("Delete this response plan?")) return;

    try {
      await fetch(`/api/response-plans?id=${id}`, {
        method: "DELETE",
      });
      fetchChallenges();
    } catch (error) {
      console.error("Failed to delete response plan:", error);
    }
  };

  const handleUpdateResponsePlanProgress = async (id: string, progress: number) => {
    try {
      await fetch("/api/response-plans", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          progress,
          status: progress >= 100 ? "COMPLETED" : "IN_PROGRESS",
        }),
      });
      fetchChallenges();
    } catch (error) {
      console.error("Failed to update progress:", error);
    }
  };

  return (
    <PageContainer
      title="Challenges"
      description="Face your challenges with a structured response plan"
      action={
        <Button onClick={() => handleOpenChallengeModal()}>
          <Plus className="w-4 h-4 mr-2" />
          New Challenge
        </Button>
      }
    >
      <div className="mb-6 flex flex-wrap gap-3">
        <Select
          value={filter.status}
          onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          options={[
            { value: "ALL", label: "All Status" },
            { value: "ACTIVE", label: "Active" },
            { value: "COMPLETED", label: "Completed" },
            { value: "ARCHIVED", label: "Archived" },
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
            { value: "GENERAL", label: "General" },
          ]}
          className="w-40"
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
      </div>

      <div className="space-y-4">
        {filteredChallenges.length > 0 ? (
          filteredChallenges.map((challenge) => (
            <Card
              key={challenge.id}
              hover
              className={clsx(
                "border-l-4 !p-0 overflow-hidden",
                priorityColors[challenge.priority]
              )}
            >
              <div
                className="p-4 cursor-pointer"
                onClick={() => toggleExpanded(challenge.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <Target className="w-5 h-5 text-primary mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-foreground">{challenge.title}</span>
                        <Badge variant={categoryColors[challenge.category] as "default"}>
                          {challenge.category}
                        </Badge>
                        <Badge variant={
                          challenge.priority === "HIGH" ? "danger" :
                          challenge.priority === "MEDIUM" ? "warning" : "success"
                        }>
                          <Flag className="w-3 h-3 mr-1" />
                          {challenge.priority}
                        </Badge>
                        <span className={clsx("px-2 py-0.5 rounded text-xs font-medium", statusColors[challenge.status])}>
                          {challenge.status}
                        </span>
                      </div>
                      {challenge.description && (
                        <p className="text-sm text-foreground-muted">{challenge.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {challenge.responsePlan && (
                      <div className="flex items-center gap-2 mr-4">
                        <div className="w-24 h-2 bg-foreground-muted/20 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${challenge.responsePlan.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-foreground-muted">
                          {challenge.responsePlan.progress}%
                        </span>
                      </div>
                    )}
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleOpenChallengeModal(challenge); }}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDeleteChallenge(challenge.id); }}>
                      <Trash2 className="w-4 h-4 text-danger" />
                    </Button>
                    {expandedChallenges.has(challenge.id) ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </div>
                </div>
              </div>

              {expandedChallenges.has(challenge.id) && (
                <div className="border-t border-border bg-background-secondary/50 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-foreground flex items-center gap-2">
                      <CheckSquare className="w-4 h-4" />
                      Response Plan
                    </h4>
                    {challenge.responsePlan ? (
                      <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={() => handleOpenResponsePlanModal(challenge)}>
                          <Edit2 className="w-3 h-3 mr-1" />
                          Edit Plan
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteResponsePlan(challenge.responsePlan!.id)}>
                          <Trash2 className="w-3 h-3 text-danger" />
                        </Button>
                      </div>
                    ) : (
                      <Button variant="primary" size="sm" onClick={() => handleOpenResponsePlanModal(challenge)}>
                        <Plus className="w-3 h-3 mr-1" />
                        Create Response Plan
                      </Button>
                    )}
                  </div>

                  {challenge.responsePlan ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="font-medium">{challenge.responsePlan.title}</span>
                        {challenge.responsePlan.deadline && (
                          <span className="flex items-center gap-1 text-foreground-muted">
                            <Clock className="w-3 h-3" />
                            {format(new Date(challenge.responsePlan.deadline), "MMM d, yyyy")}
                          </span>
                        )}
                      </div>
                      {challenge.responsePlan.description && (
                        <p className="text-sm text-foreground-muted">{challenge.responsePlan.description}</p>
                      )}
                      {(() => {
                        const steps = typeof challenge.responsePlan!.steps === "string"
                          ? JSON.parse(challenge.responsePlan!.steps)
                          : challenge.responsePlan!.steps;
                        return steps.length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-foreground-secondary">Steps:</p>
                            {steps.map((step: string, index: number) => (
                              <div key={index} className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={challenge.responsePlan!.progress >= ((index + 1) / steps.length) * 100}
                                  onChange={() => {
                                    const newProgress = Math.round(((index + 1) / steps.length) * 100);
                                    handleUpdateResponsePlanProgress(challenge.responsePlan!.id, newProgress);
                                  }}
                                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                                />
                                <span className="text-sm">{step}</span>
                              </div>
                            ))}
                          </div>
                        ) : null;
                      })()}
                    </div>
                  ) : (
                    <p className="text-sm text-foreground-muted italic">
                      No response plan yet. Create one to tackle this challenge systematically.
                    </p>
                  )}
                </div>
              )}
            </Card>
          ))
        ) : (
          <Card className="text-center py-12">
            <Target className="w-12 h-12 mx-auto text-foreground-muted mb-4" />
            <p className="text-foreground-muted mb-4">No challenges found.</p>
            <Button onClick={() => handleOpenChallengeModal()}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Challenge
            </Button>
          </Card>
        )}
      </div>

      <Modal
        isOpen={isChallengeModalOpen}
        onClose={() => setIsChallengeModalOpen(false)}
        title={editingChallenge ? "Edit Challenge" : "New Challenge"}
      >
        <div className="space-y-4">
          <Input
            label="Challenge Title"
            value={challengeForm.title}
            onChange={(e) => setChallengeForm({ ...challengeForm, title: e.target.value })}
            placeholder="What's the challenge?"
          />
          <Textarea
            label="Description"
            value={challengeForm.description}
            onChange={(e) => setChallengeForm({ ...challengeForm, description: e.target.value })}
            placeholder="Describe the challenge..."
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category"
              value={challengeForm.category}
              onChange={(e) => setChallengeForm({ ...challengeForm, category: e.target.value })}
              options={[
                { value: "WORK", label: "Work" },
                { value: "STUDY", label: "Study" },
                { value: "HEALTH", label: "Health" },
                { value: "PERSONAL", label: "Personal" },
                { value: "SOCIAL", label: "Social" },
                { value: "GENERAL", label: "General" },
              ]}
            />
            <Select
              label="Priority"
              value={challengeForm.priority}
              onChange={(e) => setChallengeForm({ ...challengeForm, priority: e.target.value })}
              options={[
                { value: "HIGH", label: "High" },
                { value: "MEDIUM", label: "Medium" },
                { value: "LOW", label: "Low" },
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
        title={`Response Plan: ${selectedChallenge?.title || ""}`}
      >
        <div className="space-y-4">
          <Input
            label="Plan Title"
            value={responsePlanForm.title}
            onChange={(e) => setResponsePlanForm({ ...responsePlanForm, title: e.target.value })}
            placeholder="Name your response plan"
          />
          <Textarea
            label="Description"
            value={responsePlanForm.description}
            onChange={(e) => setResponsePlanForm({ ...responsePlanForm, description: e.target.value })}
            placeholder="How will you tackle this challenge?"
          />
          <Textarea
            label="Steps (one per line)"
            value={responsePlanForm.steps}
            onChange={(e) => setResponsePlanForm({ ...responsePlanForm, steps: e.target.value })}
            placeholder="Step 1: ...&#10;Step 2: ...&#10;Step 3: ..."
            className="min-h-[120px]"
          />
          <Input
            label="Deadline"
            type="date"
            value={responsePlanForm.deadline}
            onChange={(e) => setResponsePlanForm({ ...responsePlanForm, deadline: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsResponsePlanModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitResponsePlan}>
              {selectedChallenge?.responsePlan ? "Save Changes" : "Create Response Plan"}
            </Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}
