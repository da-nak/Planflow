"use client";

import { useMemo } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { Badge } from "@/components/ui";
import { CheckSquare, Flame, Clock, TrendingUp } from "lucide-react";
import { format, eachDayOfInterval } from "date-fns";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line, Pie } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const categoryColors: Record<string, string> = {
  WORK: "#6366F1",
  STUDY: "#8B5CF6",
  HEALTH: "#22C55E",
  PERSONAL: "#F59E0B",
  SOCIAL: "#EC4899",
  OTHER: "#6B7280",
};

type DailyData = {
  date: string;
  completed: number;
  created: number;
};

type AnalyticsProps = {
  initialData: {
    taskCompletionRate: number;
    habitConsistency: number;
    productivityScore: number;
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    inProgressTasks: number;
    tasksByCategory: Record<string, number>;
    tasksByPriority: Record<string, number>;
    dailyTaskData: DailyData[];
    weeklyProgress: { week: string; progress: number }[];
    categoryBreakdown: { category: string; completed: number; total: number }[];
  };
  habits: Array<{
    id: string;
    name: string;
    category: string;
    logs: Array<{ date: string; status: string }>;
  }>;
};

function getCategoryColor(category: string) {
  return categoryColors[category] || categoryColors.OTHER;
}

export function AnalyticsClient({ initialData, habits }: AnalyticsProps) {
  const data = initialData;

  const habitStats = useMemo(() => {
    return habits.map((h) => {
      const completedLogs = h.logs.filter(l => l.status === "COMPLETED").length;
      const totalLogs = h.logs.length;
      const consistency = totalLogs > 0 ? Math.round((completedLogs / totalLogs) * 100) : 0;
      
      let streak = 0;
      const sortedLogs = [...h.logs]
        .filter(l => l.status === "COMPLETED")
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      for (let i = 0; i < sortedLogs.length; i++) {
        const logDate = new Date(sortedLogs[i].date);
        logDate.setHours(0, 0, 0, 0);
        
        const expectedDate = new Date(today);
        expectedDate.setDate(today.getDate() - i);
        
        if (logDate.getTime() === expectedDate.getTime()) {
          streak++;
        } else {
          break;
        }
      }
      
      return { ...h, streak, consistency };
    });
  }, [habits]);

  const pieData = {
    labels: Object.keys(data.tasksByCategory),
    datasets: [
      {
        data: Object.values(data.tasksByCategory),
        backgroundColor: Object.keys(data.tasksByCategory).map((cat) => getCategoryColor(cat)),
        borderWidth: 0,
      },
    ],
  };

  const barData = {
    labels: data.dailyTaskData.map((d) => format(new Date(d.date), "EEE")),
    datasets: [
      {
        label: "Tasks Completed",
        data: data.dailyTaskData.map((d) => d.completed),
        backgroundColor: "#6366F1",
        borderRadius: 4,
      },
    ],
  };

  const lineData = {
    labels: data.dailyTaskData.map((d) => format(new Date(d.date), "EEE")),
    datasets: [
      {
        label: "Cumulative Progress",
        data: data.dailyTaskData.reduce((acc: number[], d) => {
          const prev = acc.length > 0 ? acc[acc.length - 1] : 0;
          acc.push(prev + d.completed);
          return acc;
        }, []),
        borderColor: "#6366F1",
        backgroundColor: "#6366F1",
        tension: 0.3,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: "rgba(148, 163, 184, 0.1)" },
        ticks: { color: "#94A3B8" },
      },
      x: {
        grid: { display: false },
        ticks: { color: "#94A3B8" },
      },
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right" as const,
        labels: { color: "#94A3B8", usePointStyle: true, padding: 20 },
      },
    },
  };

  return (
    <PageContainer
      title="Analytics"
      description="Track your productivity based on actual task completion"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-foreground-muted">Productivity Score</p>
                <p className="text-2xl font-bold text-foreground">{data.productivityScore}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-success/10">
                <CheckSquare className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-foreground-muted">Task Completion</p>
                <p className="text-2xl font-bold text-foreground">{data.taskCompletionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-warning/10">
                <Flame className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-foreground-muted">Habit Consistency</p>
                <p className="text-2xl font-bold text-foreground">{data.habitConsistency}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-info/10">
                <Clock className="w-5 h-5 text-info" />
              </div>
              <div>
                <p className="text-sm text-foreground-muted">Tasks Done</p>
                <p className="text-2xl font-bold text-foreground">{data.completedTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Tasks Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Bar data={barData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Progress Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Line data={lineData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Task Distribution by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {Object.keys(data.tasksByCategory).length > 0 ? (
                <Pie data={pieData} options={pieOptions} />
              ) : (
                <div className="h-full flex items-center justify-center text-foreground-muted">
                  No tasks for this period
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Habit Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {habitStats.map((habit) => (
              <div key={habit.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getCategoryColor(habit.category) }}
                  />
                  <span className="font-medium text-foreground">{habit.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Flame className="w-4 h-4 text-warning" />
                    <span className="text-sm font-medium">{habit.streak}</span>
                  </div>
                  <Badge variant={habit.consistency >= 80 ? "success" : habit.consistency >= 50 ? "warning" : "danger"}>
                    {habit.consistency}%
                  </Badge>
                </div>
              </div>
            ))}
            {habitStats.length === 0 && (
              <p className="text-foreground-muted text-center py-4">No habits to display</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Priority Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(data.tasksByPriority).map(([priority, count]) => (
              <div key={priority} className="flex items-center justify-between">
                <span className="text-foreground-secondary">{priority}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-background-tertiary rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        priority === "HIGH" ? "bg-danger" : priority === "MEDIUM" ? "bg-warning" : "bg-success"
                      }`}
                      style={{ width: `${data.totalTasks > 0 ? (count / data.totalTasks) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-8">{count}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.categoryBreakdown.map((cat) => (
              <div key={cat.category} className="flex items-center justify-between">
                <span className="text-foreground-secondary">{cat.category}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-background-tertiary rounded-full overflow-hidden">
                    <div
                      className="h-full"
                      style={{ 
                        width: `${cat.total > 0 ? (cat.completed / cat.total) * 100 : 0}%`,
                        backgroundColor: getCategoryColor(cat.category)
                      }}
                    />
                  </div>
                  <span className="text-sm text-foreground-muted w-12">
                    {cat.completed}/{cat.total}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
