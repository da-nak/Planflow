"use client";

import { useState, useEffect } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui";
import { Badge } from "@/components/ui";
import { format } from "date-fns";
import { 
  BookOpen, 
  Save, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Smile,
  Meh,
  Frown,
  Heart,
  CheckSquare,
  XSquare,
  Sparkles
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const MOODS = [
  { value: 1, icon: Frown, label: "Awful", color: "text-danger" },
  { value: 2, icon: Meh, label: "Meh", color: "text-warning" },
  { value: 3, icon: Smile, label: "Okay", color: "text-info" },
  { value: 4, icon: Heart, label: "Good", color: "text-success" },
  { value: 5, icon: Sparkles, label: "Great", color: "text-primary" },
];

const PROMPTS = [
  { key: "promptAccomplishments", label: "What did you accomplish today?", placeholder: "List your wins, big or small..." },
  { key: "promptWentWell", label: "What went well?", placeholder: "What made you smile or feel proud?" },
  { key: "promptDidntGoWell", label: "What didn't go well?", placeholder: "Challenges you faced..." },
  { key: "promptImproveTomorrow", label: "What can you improve tomorrow?", placeholder: "One thing to focus on..." },
];

const SUGGESTED_TAGS = ["work", "health", "study", "personal", "relationships", "creative", "fitness", "learning"];

interface Task {
  id: string;
  title: string;
  status: string;
  completedAt: string | null;
}

interface JournalEntry {
  id: string;
  title: string | null;
  content: string;
  mood: number;
  tags: string;
  promptAccomplishments: string | null;
  promptWentWell: string | null;
  promptDidntGoWell: string | null;
  promptImproveTomorrow: string | null;
  completedTaskIds: string;
  missedTaskIds: string;
  createdAt: string;
}

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [todayEntry, setTodayEntry] = useState<JournalEntry | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState(3);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [prompts, setPrompts] = useState<Record<string, string>>({});
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const [missedTaskIds, setMissedTaskIds] = useState<string[]>([]);

  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    setLoading(true);
    
    const [entriesRes, tasksRes] = await Promise.all([
      fetch("/api/journal"),
      fetch("/api/hierarchy/tasks"),
    ]);

    if (entriesRes.ok) {
      const data = await entriesRes.json();
      setEntries(data.entries || []);
      
      const todayStr = format(selectedDate, "yyyy-MM-dd");
      const todayEntryData = data.entries?.find((e: JournalEntry) => 
        format(new Date(e.createdAt), "yyyy-MM-dd") === todayStr
      );
      
      if (todayEntryData) {
        setTodayEntry(todayEntryData);
        setTitle(todayEntryData.title || "");
        setContent(todayEntryData.content);
        setMood(todayEntryData.mood);
        setSelectedTags(JSON.parse(todayEntryData.tags || "[]"));
        setPrompts({
          promptAccomplishments: todayEntryData.promptAccomplishments || "",
          promptWentWell: todayEntryData.promptWentWell || "",
          promptDidntGoWell: todayEntryData.promptDidntGoWell || "",
          promptImproveTomorrow: todayEntryData.promptImproveTomorrow || "",
        });
        setCompletedTaskIds(JSON.parse(todayEntryData.completedTaskIds || "[]"));
        setMissedTaskIds(JSON.parse(todayEntryData.mpletedTaskIds || "[]"));
      } else {
        resetForm();
      }
    }

    if (tasksRes.ok) {
      const data = await tasksRes.json();
      setTasks(data.tasks || []);
    }

    setLoading(false);
  };

  const resetForm = () => {
    setTodayEntry(null);
    setTitle("");
    setContent("");
    setMood(3);
    setSelectedTags([]);
    setPrompts({});
    setCompletedTaskIds([]);
    setMissedTaskIds([]);
  };

  const saveEntry = async () => {
    if (!content.trim()) return;
    
    setSaving(true);

    const entryData = {
      title: title || null,
      content,
      mood,
      tags: selectedTags,
      ...prompts,
      completedTaskIds,
      missedTaskIds,
    };

    try {
      let response;
      if (todayEntry) {
        response = await fetch(`/api/journal/${todayEntry.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(entryData),
        });
      } else {
        response = await fetch("/api/journal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(entryData),
        });
      }

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Failed to save entry:", error);
    }

    setSaving(false);
  };

  const deleteEntry = async () => {
    if (!todayEntry) return;
    
    const response = await fetch(`/api/journal/${todayEntry.id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      resetForm();
      fetchData();
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const toggleTask = (taskId: string, isCompleted: boolean) => {
    if (isCompleted) {
      setCompletedTaskIds(prev => 
        prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
      );
    } else {
      setMissedTaskIds(prev => 
        prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
      );
    }
  };

  const completedTasks = tasks.filter(t => t.status === "COMPLETED");
  const pendingTasks = tasks.filter(t => t.status === "PENDING");
  const currentMood = MOODS.find(m => m.value === mood);

  return (
    <PageContainer 
      title="Journal" 
      description="Reflect on your day, track your mood, and connect with your tasks."
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  {todayEntry ? "Edit Today's Entry" : "Write Today's Entry"}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSelectedDate(new Date(selectedDate.getTime() - 86400000))}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm font-medium min-w-[100px] text-center">
                    {format(selectedDate, "MMM d, yyyy")}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSelectedDate(new Date(selectedDate.getTime() + 86400000))}
                    disabled={format(selectedDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <Input
                placeholder="Entry title (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-lg font-semibold"
              />

              <div>
                <label className="block text-sm font-medium text-foreground-secondary mb-2">
                  How are you feeling?
                </label>
                <div className="flex items-center gap-2">
                  {MOODS.map((m) => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.value}
                        onClick={() => setMood(m.value)}
                        className={`p-3 rounded-lg transition-all ${
                          mood === m.value 
                            ? "bg-primary/10 ring-2 ring-primary" 
                            : "bg-background-tertiary hover:bg-background-secondary"
                        }`}
                        title={m.label}
                      >
                        <Icon className={`w-5 h-5 ${mood === m.value ? m.color : "text-foreground-muted"}`} />
                      </button>
                    );
                  })}
                  <span className="ml-2 text-sm text-foreground-muted">
                    {currentMood?.label}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-secondary mb-2">
                  What's on your mind?
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your thoughts..."
                  className="w-full min-h-[150px] px-4 py-3 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary resize-y"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-secondary mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_TAGS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        selectedTags.includes(tag)
                          ? "bg-primary text-white"
                          : "bg-background-tertiary text-foreground-secondary hover:bg-background-secondary"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-border pt-6 space-y-4">
                <h3 className="font-medium text-foreground">Reflection Prompts (Optional)</h3>
                {PROMPTS.map((prompt) => (
                  <div key={prompt.key}>
                    <label className="block text-sm text-foreground-secondary mb-1">
                      {prompt.label}
                    </label>
                    <textarea
                      value={prompts[prompt.key] || ""}
                      onChange={(e) => setPrompts(prev => ({ ...prev, [prompt.key]: e.target.value }))}
                      placeholder={prompt.placeholder}
                      className="w-full min-h-[60px] px-3 py-2 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary resize-y text-sm"
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={saveEntry} disabled={saving || !content.trim()}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Saving..." : todayEntry ? "Update Entry" : "Save Entry"}
                </Button>
                {todayEntry && (
                  <Button variant="danger" onClick={deleteEntry}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Today's Tasks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2 text-sm text-foreground-secondary">
                  <CheckSquare className="w-4 h-4 text-success" />
                  <span>Completed ({completedTasks.length})</span>
                </div>
                <div className="space-y-1">
                  {completedTasks.slice(0, 5).map((task) => (
                    <label key={task.id} className="flex items-center gap-2 p-2 rounded hover:bg-background-tertiary cursor-pointer">
                      <input
                        type="checkbox"
                        checked={completedTaskIds.includes(task.id)}
                        onChange={() => toggleTask(task.id, true)}
                        className="rounded"
                      />
                      <span className="text-sm line-through text-foreground-muted">{task.title}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2 text-sm text-foreground-secondary">
                  <XSquare className="w-4 h-4 text-warning" />
                  <span>Pending ({pendingTasks.length})</span>
                </div>
                <div className="space-y-1">
                  {pendingTasks.slice(0, 5).map((task) => (
                    <label key={task.id} className="flex items-center gap-2 p-2 rounded hover:bg-background-tertiary cursor-pointer">
                      <input
                        type="checkbox"
                        checked={missedTaskIds.includes(task.id)}
                        onChange={() => toggleTask(task.id, false)}
                        className="rounded"
                      />
                      <span className="text-sm">{task.title}</span>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Entries</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {entries.length === 0 ? (
                <p className="text-sm text-foreground-muted text-center py-4">
                  No entries yet. Start writing!
                </p>
              ) : (
                entries.slice(0, 7).map((entry) => {
                  const entryMood = MOODS.find(m => m.value === entry.mood);
                  const Icon = entryMood?.icon || Smile;
                  return (
                    <button
                      key={entry.id}
                      onClick={() => setSelectedDate(new Date(entry.createdAt))}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                        todayEntry?.id === entry.id 
                          ? "bg-primary/10" 
                          : "hover:bg-background-tertiary"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${entryMood?.color || "text-foreground-muted"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {entry.title || format(new Date(entry.createdAt), "MMM d")}
                        </p>
                        <p className="text-xs text-foreground-muted">
                          {format(new Date(entry.createdAt), "MMM d, yyyy")}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
