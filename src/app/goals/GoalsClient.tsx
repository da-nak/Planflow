"use client";

import { useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { Button } from "@/components/ui";
import { Input, Textarea } from "@/components/ui";
import { Modal } from "@/components/ui";
import { Badge } from "@/components/ui";
import { Progress } from "@/components/ui";
import { Plus, ChevronRight, ChevronDown, Trash2, Edit2, Target, Calendar, Clock } from "lucide-react";
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
  progress?: number;
};

type MonthlyGoal = {
  id: string;
  yearlyGoalId: string;
  title: string;
  description: string | null;
  deadline: Date | null;
  notes: string | null;
  status: string;
  weeklyPlans: WeeklyPlan[];
  progress?: number;
};

type YearlyGoal = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  deadline: Date | null;
  notes: string | null;
  status: string;
  monthlyGoals: MonthlyGoal[];
  progress?: number;
};

type HierarchicalData = YearlyGoal[];

interface GoalsClientProps {
  userId: string;
  initialHierarchy: HierarchicalData;
}

type ModalMode = "yearly" | "monthly" | "weekly" | null;

export function GoalsClient({ userId, initialHierarchy }: GoalsClientProps) {
  const [hierarchy, setHierarchy] = useState<HierarchicalData>(initialHierarchy);
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [parentId, setParentId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    deadline: "",
    notes: "",
    startDate: "",
    endDate: "",
  });

  const toggleGoalExpanded = (id: string) => {
    setExpandedGoals((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleMonthExpanded = (id: string) => {
    setExpandedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleOpenModal = (mode: ModalMode, id?: string, parentIdValue?: string) => {
    setModalMode(mode);
    setEditingId(id || null);
    setParentId(parentIdValue || null);
    
    if (id) {
      let item: any = null;
      if (mode === "yearly") {
        item = hierarchy.find(g => g.id === id);
      } else if (mode === "monthly") {
        for (const yg of hierarchy) {
          const mg = yg.monthlyGoals.find(m => m.id === id);
          if (mg) { item = mg; break; }
        }
      }
      
      if (item) {
        setFormData({
          title: item.title || "",
          description: item.description || "",
          deadline: item.deadline ? format(new Date(item.deadline), "yyyy-MM-dd") : "",
          notes: item.notes || "",
          startDate: item.startDate ? format(new Date(item.startDate), "yyyy-MM-dd") : "",
          endDate: item.endDate ? format(new Date(item.endDate), "yyyy-MM-dd") : "",
        });
      }
    } else {
      setFormData({
        title: "",
        description: "",
        deadline: "",
        notes: "",
        startDate: format(new Date(), "yyyy-MM-dd"),
        endDate: format(new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalMode(null);
    setEditingId(null);
    setParentId(null);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) return;

    try {
      let endpoint = "";
      let method = "POST";
      let body: any = {};

      if (modalMode === "yearly") {
        endpoint = "/api/hierarchy/yearly-goals";
        if (editingId) {
          method = "PUT";
          body = { id: editingId, ...formData, deadline: formData.deadline ? new Date(formData.deadline) : undefined };
        } else {
          body = { userId, ...formData, deadline: formData.deadline ? new Date(formData.deadline) : undefined };
        }
      } else if (modalMode === "monthly") {
        endpoint = "/api/hierarchy/monthly-goals";
        if (editingId) {
          method = "PUT";
          body = { id: editingId, ...formData, deadline: formData.deadline ? new Date(formData.deadline) : undefined };
        } else {
          body = { yearlyGoalId: parentId, ...formData, deadline: formData.deadline ? new Date(formData.deadline) : undefined };
        }
      } else if (modalMode === "weekly") {
        endpoint = "/api/hierarchy/weekly-plans";
        if (editingId) {
          method = "PUT";
          body = { 
            id: editingId, 
            ...formData, 
            startDate: formData.startDate ? new Date(formData.startDate) : undefined,
            endDate: formData.endDate ? new Date(formData.endDate) : undefined,
          };
        } else {
          body = { 
            monthlyGoalId: parentId, 
            ...formData, 
            startDate: new Date(formData.startDate),
            endDate: new Date(formData.endDate),
          };
        }
      }

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to save:", error);
    }
  };

  const handleDelete = async (mode: ModalMode, id: string) => {
    if (!confirm("Are you sure you want to delete this? This will also delete all child items.")) return;

    try {
      let endpoint = "";
      if (mode === "yearly") endpoint = `/api/hierarchy/yearly-goals?id=${id}`;
      else if (mode === "monthly") endpoint = `/api/hierarchy/monthly-goals?id=${id}`;
      else if (mode === "weekly") endpoint = `/api/hierarchy/weekly-plans?id=${id}`;

      const response = await fetch(endpoint, { method: "DELETE" });
      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  const totalTasks = hierarchy.reduce((sum, yg) => 
    sum + yg.monthlyGoals.reduce((mSum, mg) => 
      mSum + mg.weeklyPlans.reduce((wSum, wp) => wSum + wp.tasks.length, 0), 0), 0);

  return (
    <PageContainer
      title="Goals"
      description="Manage your yearly, monthly, and weekly goals with tasks"
      action={
        <Button onClick={() => handleOpenModal("yearly")}>
          <Plus className="w-4 h-4 mr-2" />
          Add Yearly Goal
        </Button>
      }
    >
      <div className="mb-6 p-4 bg-primary/5 rounded-lg">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <span className="text-foreground-muted">Yearly Goals:</span>
            <span className="font-semibold">{hierarchy.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-info" />
            <span className="text-foreground-muted">Monthly Goals:</span>
            <span className="font-semibold">
              {hierarchy.reduce((sum, yg) => sum + yg.monthlyGoals.length, 0)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-warning" />
            <span className="text-foreground-muted">Weekly Plans:</span>
            <span className="font-semibold">
              {hierarchy.reduce((sum, yg) => 
                sum + yg.monthlyGoals.reduce((mSum, mg) => mSum + mg.weeklyPlans.length, 0), 0)}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {hierarchy.length > 0 ? (
          hierarchy.map((yearlyGoal) => (
            <Card key={yearlyGoal.id} className="!p-0 overflow-hidden">
              <div className="p-4 bg-primary/5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 flex-1">
                    <button
                      onClick={() => toggleGoalExpanded(yearlyGoal.id)}
                      className="mt-1 p-1 rounded hover:bg-primary/10"
                    >
                      {expandedGoals.has(yearlyGoal.id) ? (
                        <ChevronDown className="w-5 h-5 text-foreground-muted" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-foreground-muted" />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Target className="w-5 h-5 text-primary" />
                        <span className="font-semibold text-lg">{yearlyGoal.title}</span>
                        <Badge variant="primary">Yearly</Badge>
                        {yearlyGoal.status === "COMPLETED" && <Badge variant="success">Done</Badge>}
                      </div>
                      {yearlyGoal.description && (
                        <p className="text-sm text-foreground-muted mb-2">{yearlyGoal.description}</p>
                      )}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 flex-1 max-w-md">
                          <Progress value={yearlyGoal.progress || 0} className="flex-1" />
                          <span className="text-sm text-foreground-muted w-10">{yearlyGoal.progress || 0}%</span>
                        </div>
                        <span className="text-sm text-foreground-muted">
                          {yearlyGoal.monthlyGoals.length} monthly goals
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleOpenModal("monthly", undefined, yearlyGoal.id)}>
                      <Plus className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleOpenModal("yearly", yearlyGoal.id)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete("yearly", yearlyGoal.id)}>
                      <Trash2 className="w-4 h-4 text-danger" />
                    </Button>
                  </div>
                </div>
              </div>

              {expandedGoals.has(yearlyGoal.id) && yearlyGoal.monthlyGoals.length > 0 && (
                <div className="p-4 space-y-3">
                  {yearlyGoal.monthlyGoals.map((monthlyGoal) => (
                    <div key={monthlyGoal.id} className="border border-border rounded-lg p-3 pl-6">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2 flex-1">
                          <button
                            onClick={() => toggleMonthExpanded(monthlyGoal.id)}
                            className="mt-0.5 p-0.5 rounded hover:bg-background-tertiary"
                          >
                            {expandedMonths.has(monthlyGoal.id) ? (
                              <ChevronDown className="w-4 h-4 text-foreground-muted" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-foreground-muted" />
                            )}
                          </button>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Calendar className="w-4 h-4 text-info" />
                              <span className="font-medium">{monthlyGoal.title}</span>
                              <Badge variant="info">Monthly</Badge>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2 flex-1 max-w-xs">
                                <Progress value={monthlyGoal.progress || 0} className="flex-1" />
                                <span className="text-xs text-foreground-muted w-8">{monthlyGoal.progress || 0}%</span>
                              </div>
                              <span className="text-xs text-foreground-muted">
                                {monthlyGoal.weeklyPlans.length} weeks
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleOpenModal("weekly", undefined, monthlyGoal.id)}>
                            <Plus className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete("monthly", monthlyGoal.id)}>
                            <Trash2 className="w-4 h-4 text-danger" />
                          </Button>
                        </div>
                      </div>

                      {expandedMonths.has(monthlyGoal.id) && monthlyGoal.weeklyPlans.length > 0 && (
                        <div className="mt-3 space-y-2 pl-6">
                          {monthlyGoal.weeklyPlans.map((weeklyPlan) => (
                            <div key={weeklyPlan.id} className="flex items-center justify-between p-2 bg-background-tertiary rounded">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-warning" />
                                <span className="text-sm">{weeklyPlan.title}</span>
                                <span className="text-xs text-foreground-muted">
                                  ({format(new Date(weeklyPlan.startDate), "MMM d")} - {format(new Date(weeklyPlan.endDate), "MMM d")})
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={weeklyPlan.tasks.filter(t => t.status === "COMPLETED").length === weeklyPlan.tasks.length ? "success" : "warning"}>
                                  {weeklyPlan.tasks.filter(t => t.status === "COMPLETED").length}/{weeklyPlan.tasks.length}
                                </Badge>
                                <Button variant="ghost" size="sm" onClick={() => handleDelete("weekly", weeklyPlan.id)}>
                                  <Trash2 className="w-3 h-3 text-danger" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))
        ) : (
          <Card className="text-center py-12">
            <Target className="w-12 h-12 mx-auto text-foreground-muted mb-4" />
            <p className="text-foreground-muted mb-4">No goals yet. Create your first yearly goal!</p>
            <Button onClick={() => handleOpenModal("yearly")}>
              <Plus className="w-4 h-4 mr-2" />
              Add Yearly Goal
            </Button>
          </Card>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={
          modalMode === "yearly" ? (editingId ? "Edit Yearly Goal" : "Create Yearly Goal") :
          modalMode === "monthly" ? (editingId ? "Edit Monthly Goal" : "Create Monthly Goal") :
          (editingId ? "Edit Weekly Plan" : "Create Weekly Plan")
        }
      >
        <div className="space-y-4">
          <Input
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Enter title"
          />
          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter description"
          />
          {modalMode === "weekly" ? (
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Date"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
              <Input
                label="End Date"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          ) : (
            <Input
              label="Deadline"
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            />
          )}
          <Textarea
            label="Notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Additional notes"
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingId ? "Save Changes" : `Create ${modalMode === "yearly" ? "Goal" : modalMode === "monthly" ? "Goal" : "Plan"}`}
            </Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}
