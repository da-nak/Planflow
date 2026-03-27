"use client";

import { useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { Button } from "@/components/ui";
import { Input, Textarea } from "@/components/ui";
import { Select } from "@/components/ui";
import { Modal } from "@/components/ui";
import { Badge } from "@/components/ui";
import { Toggle } from "@/components/ui";
import { Plus, Flame, Trash2, Edit2, Check, X } from "lucide-react";
import { clsx } from "clsx";
import { format } from "date-fns";
import { calculateStreak } from "@/lib/data";

type Habit = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  targetDays: string;
  createdAt: Date;
  updatedAt: Date;
  logs: {
    id: string;
    date: Date;
    status: string;
  }[];
};

interface HabitsClientProps {
  userId: string;
  initialHabits: Habit[];
}

const categoryColors: Record<string, string> = {
  WORK: "work",
  STUDY: "study",
  HEALTH: "health",
  PERSONAL: "personal",
  SOCIAL: "social",
  OTHER: "other",
};

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function HabitsClient({ userId, initialHabits }: HabitsClientProps) {
  const [habits, setHabits] = useState<Habit[]>(initialHabits);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "PERSONAL",
    targetDays: [1, 2, 3, 4, 5] as number[],
  });

  const getHabitStats = (habit: Habit) => {
    const streak = calculateStreak(habit.logs);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayLog = habit.logs.find((l) => {
      const logDate = new Date(l.date);
      logDate.setHours(0, 0, 0, 0);
      return logDate.getTime() === today.getTime();
    });

    return { streak, todayStatus: todayLog?.status || null };
  };

  const handleOpenModal = (habit?: Habit) => {
    if (habit) {
      setEditingHabit(habit);
      setFormData({
        name: habit.name,
        description: habit.description || "",
        category: habit.category,
        targetDays: JSON.parse(habit.targetDays),
      });
    } else {
      setEditingHabit(null);
      setFormData({
        name: "",
        description: "",
        category: "PERSONAL",
        targetDays: [1, 2, 3, 4, 5],
      });
    }
    setIsModalOpen(true);
  };

  const toggleDay = (day: number) => {
    setFormData((prev) => ({
      ...prev,
      targetDays: prev.targetDays.includes(day)
        ? prev.targetDays.filter((d) => d !== day)
        : [...prev.targetDays, day].sort(),
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;

    try {
      const response = await fetch("/api/habits", {
        method: editingHabit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingHabit?.id,
          userId,
          name: formData.name,
          description: formData.description || undefined,
          category: formData.category,
          targetDays: JSON.stringify(formData.targetDays),
        }),
      });

      if (response.ok) {
        const updatedHabit = await response.json();
        if (editingHabit) {
          setHabits(habits.map((h) => (h.id === editingHabit.id ? updatedHabit : h)));
        } else {
          setHabits([updatedHabit, ...habits]);
        }
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error("Failed to save habit:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this habit?")) return;

    try {
      const response = await fetch(`/api/habits?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setHabits(habits.filter((h) => h.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete habit:", error);
    }
  };

  const handleLogHabit = async (habitId: string, status: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      const response = await fetch("/api/habits/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          habitId,
          date: today.toISOString(),
          status,
        }),
      });

      if (response.ok) {
        const newLog = await response.json();
        setHabits(
          habits.map((h) =>
            h.id === habitId
              ? { ...h, logs: [newLog, ...h.logs] }
              : h
          )
        );
      }
    } catch (error) {
      console.error("Failed to log habit:", error);
    }
  };

  return (
    <PageContainer
      title="Habits"
      description="Track your daily routines and build consistency"
      action={
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Habit
        </Button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {habits.length > 0 ? (
          habits.map((habit) => {
            const { streak, todayStatus } = getHabitStats(habit);
            const targetDays = JSON.parse(habit.targetDays) as number[];
            
            return (
              <Card key={habit.id} className="!p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground truncate">{habit.name}</h3>
                      <Badge variant={categoryColors[habit.category] as any}>
                        {habit.category}
                      </Badge>
                    </div>
                    {habit.description && (
                      <p className="text-sm text-foreground-muted">{habit.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleOpenModal(habit)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(habit.id)}>
                      <Trash2 className="w-4 h-4 text-danger" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-warning" />
                    <span className="text-2xl font-bold text-foreground">{streak}</span>
                    <span className="text-sm text-foreground-muted">day streak</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {todayStatus === "COMPLETED" ? (
                      <Button
                        size="sm"
                        className="!bg-success hover:!bg-green-600"
                        onClick={() => handleLogHabit(habit.id, "COMPLETED")}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Done
                      </Button>
                    ) : todayStatus === "SKIPPED" ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleLogHabit(habit.id, "SKIPPED")}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Skipped
                      </Button>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          className="!bg-success hover:!bg-green-600"
                          onClick={() => handleLogHabit(habit.id, "COMPLETED")}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Complete
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleLogHabit(habit.id, "SKIPPED")}
                        >
                          Skip
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  {dayNames.map((day, index) => (
                    <div
                      key={day}
                      className={clsx(
                        "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium",
                        targetDays.includes(index)
                          ? "bg-primary/10 text-primary"
                          : "bg-background-tertiary text-foreground-muted"
                      )}
                    >
                      {day[0]}
                    </div>
                  ))}
                </div>
              </Card>
            );
          })
        ) : (
          <Card className="col-span-full text-center py-12">
            <Flame className="w-12 h-12 mx-auto text-foreground-muted mb-4" />
            <p className="text-foreground-muted mb-4">No habits yet. Create your first habit!</p>
            <Button onClick={() => handleOpenModal()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Habit
            </Button>
          </Card>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingHabit ? "Edit Habit" : "Create New Habit"}
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter habit name"
          />
          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter habit description"
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
          <div>
            <label className="block text-sm font-medium text-foreground-secondary mb-2">
              Target Days
            </label>
            <div className="flex items-center justify-between">
              {dayNames.map((day, index) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(index)}
                  className={clsx(
                    "w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-colors",
                    formData.targetDays.includes(index)
                      ? "bg-primary text-white"
                      : "bg-background-tertiary text-foreground-muted hover:bg-primary/10"
                  )}
                >
                  {day[0]}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingHabit ? "Save Changes" : "Create Habit"}
            </Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}
