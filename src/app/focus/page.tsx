"use client";

import { useState, useEffect, useCallback } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { Button } from "@/components/ui";
import { Play, Pause, RotateCcw, Coffee, Target, CheckSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const PRESETS = [
  { label: "25 min", duration: 25, type: "work" },
  { label: "45 min", duration: 45, type: "work" },
  { label: "60 min", duration: 60, type: "work" },
  { label: "5 min", duration: 5, type: "break" },
  { label: "15 min", duration: 15, type: "break" },
];

interface Task {
  id: string;
  title: string;
}

export default function FocusPage() {
  const [selectedDuration, setSelectedDuration] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedTaskTitle, setSelectedTaskTitle] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    fetchTasks();
    loadStats();
  }, []);

  const fetchTasks = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const response = await fetch("/api/hierarchy/tasks?status=PENDING");
    if (response.ok) {
      const data = await response.json();
      setTasks(data.tasks?.slice(0, 10) || []);
    }
  };

  const loadStats = async () => {
    const saved = localStorage.getItem("focusStats");
    if (saved) {
      setSessionsCompleted(JSON.parse(saved).sessions || 0);
    }
  };

  const saveStats = useCallback((sessions: number) => {
    localStorage.setItem("focusStats", JSON.stringify({ sessions }));
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      if (!isBreak) {
        const newSessions = sessionsCompleted + 1;
        setSessionsCompleted(newSessions);
        saveStats(newSessions);
        logSession(selectedTaskId, selectedTaskTitle, selectedDuration);
        setIsBreak(true);
        setTimeLeft(5 * 60);
      } else {
        setIsBreak(false);
        setTimeLeft(selectedDuration * 60);
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, isBreak, selectedDuration, sessionsCompleted, saveStats, selectedTaskId, selectedTaskTitle]);

  const logSession = async (taskId: string | null, taskTitle: string | null, duration: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await fetch("/api/focus/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        duration,
        type: isBreak ? "break" : "work",
        taskId,
        taskTitle,
      }),
    });
  };

  const toggleTimer = () => setIsRunning(!isRunning);

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(selectedDuration * 60);
    setIsBreak(false);
  };

  const selectPreset = (preset: typeof PRESETS[0]) => {
    setSelectedDuration(preset.duration);
    setTimeLeft(preset.duration * 60);
    setIsBreak(preset.type === "break");
    setIsRunning(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = ((selectedDuration * 60 - timeLeft) / (selectedDuration * 60)) * 100;

  return (
    <PageContainer title="Focus Timer" description="Stay focused and track your productivity.">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardContent className="pt-6 flex flex-col items-center">
            <div className="relative w-64 h-64 mb-8">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-border"
                />
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeLinecap="round"
                  className={isBreak ? "text-info" : "text-primary"}
                  style={{
                    strokeDasharray: 754,
                    strokeDashoffset: 754 - (754 * progress) / 100,
                    transition: "stroke-dashoffset 0.5s ease",
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-5xl font-bold ${isBreak ? "text-info" : "text-foreground"}`}>
                  {formatTime(timeLeft)}
                </span>
                <span className="text-sm text-foreground-muted mt-2">
                  {isBreak ? "Break Time" : "Focus Time"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="secondary"
                size="lg"
                onClick={resetTimer}
                className="rounded-full"
              >
                <RotateCcw className="w-5 h-5" />
              </Button>
              <Button
                size="lg"
                onClick={toggleTimer}
                className="rounded-full px-8"
              >
                {isRunning ? (
                  <><Pause className="w-5 h-5 mr-2" /> Pause</>
                ) : (
                  <><Play className="w-5 h-5 mr-2" /> Start</>
                )}
              </Button>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => selectPreset(preset)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedDuration === preset.duration && isBreak === (preset.type === "break")
                      ? "bg-primary text-white"
                      : "bg-background-tertiary text-foreground-secondary hover:bg-background-secondary"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Link to Task (Optional)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <select
              value={selectedTaskId || ""}
              onChange={(e) => {
                const task = tasks.find((t) => t.id === e.target.value);
                setSelectedTaskId(e.target.value || null);
                setSelectedTaskTitle(task?.title || null);
              }}
              className="w-full px-4 py-2 rounded-lg bg-background-tertiary border border-border text-foreground"
            >
              <option value="">No task selected</option>
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-primary/10">
                  <Coffee className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-foreground-muted">Sessions Completed</p>
                  <p className="text-2xl font-bold text-foreground">{sessionsCompleted}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-success/10">
                  <CheckSquare className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-foreground-muted">Total Focus Time</p>
                  <p className="text-2xl font-bold text-foreground">
                    {Math.round((sessionsCompleted * selectedDuration) / 60)}h {sessionsCompleted * selectedDuration % 60}m
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
