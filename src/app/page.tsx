import { getUser } from "@/lib/server-data";
import { getHabits, getHierarchicalData, calculateStreak, type HierarchicalData } from "@/lib/data";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { Badge } from "@/components/ui";
import { Progress } from "@/components/ui";
import { Target, CheckSquare, Flame, TrendingUp, Clock, ChevronRight, Calendar, BookOpen, CheckCircle, Circle } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

function getAllTasks(hierarchy: HierarchicalData) {
  return hierarchy.flatMap(yg => 
    yg.monthlyGoals.flatMap(mg => 
      mg.weeklyPlans.flatMap(wp => wp.tasks)
    )
  );
}

function getRecentTasks(hierarchy: HierarchicalData, limit: number) {
  const allTasks = getAllTasks(hierarchy);
  return allTasks
    .filter(t => t.status !== "COMPLETED")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

function getCompletedThisWeek(hierarchy: HierarchicalData) {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  const allTasks = getAllTasks(hierarchy);
  return allTasks.filter(t => {
    if (!t.completedAt) return false;
    return new Date(t.completedAt) >= oneWeekAgo;
  });
}

function getTotalTasks(hierarchy: HierarchicalData) {
  return getAllTasks(hierarchy).length;
}

function getCompletedTasks(hierarchy: HierarchicalData) {
  return getAllTasks(hierarchy).filter(t => t.status === "COMPLETED").length;
}

function getPendingTasks(hierarchy: HierarchicalData) {
  return getAllTasks(hierarchy).filter(t => t.status === "PENDING");
}

function getTodayTasks(hierarchy: HierarchicalData) {
  const today = new Date();
  const allTasks = getAllTasks(hierarchy);
  return allTasks.filter(t => {
    if (!t.deadline) return false;
    const deadline = new Date(t.deadline);
    return deadline.toDateString() === today.toDateString();
  });
}

function getTodayCompletedTasks(hierarchy: HierarchicalData) {
  const today = new Date();
  const allTasks = getAllTasks(hierarchy);
  return allTasks.filter(t => {
    if (!t.completedAt) return false;
    const completed = new Date(t.completedAt);
    return completed.toDateString() === today.toDateString();
  });
}

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) return <div>Loading...</div>;

  const hierarchy = await getHierarchicalData(user.id) as HierarchicalData;
  const habits = await getHabits(user.id);

  const totalTasks = getTotalTasks(hierarchy);
  const completedTasks = getCompletedTasks(hierarchy);
  const pendingTasks = getPendingTasks(hierarchy);
  const completedThisWeek = getCompletedThisWeek(hierarchy);
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const habitStats = habits.map(h => ({
    ...h,
    streak: calculateStreak(h.logs),
    completedToday: h.logs.some(l => {
      const today = new Date();
      const logDate = new Date(l.date);
      return logDate.toDateString() === today.toDateString() && l.status === "COMPLETED";
    }),
  }));

  const avgStreak = habitStats.length > 0 
    ? Math.round(habitStats.reduce((acc, h) => acc + h.streak, 0) / habitStats.length)
    : 0;

  const recentTasks = getRecentTasks(hierarchy, 4);
  const activeYearlyGoals = hierarchy.filter(g => g.status === "ACTIVE");
  const todayTasks = getTodayTasks(hierarchy);
  const todayCompletedTasks = getTodayCompletedTasks(hierarchy);
  const todayHabitsCompleted = habitStats.filter(h => h.completedToday).length;
  const todayProgress = todayTasks.length > 0 
    ? Math.round((todayCompletedTasks.length / todayTasks.length) * 100) 
    : todayHabitsCompleted > 0 ? Math.round((todayHabitsCompleted / habitStats.length) * 100) : 0;

  return (
    <PageContainer title="Dashboard" description="Welcome back! Here&apos;s your overview.">
      <Card className="mb-8 bg-gradient-to-r from-primary/10 to-info/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/20">
                <CheckCircle className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-foreground-secondary">Today's Progress</p>
                <p className="text-2xl font-bold">{todayProgress}%</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-lg font-semibold">{todayCompletedTasks.length}/{todayTasks.length}</p>
                <p className="text-xs text-foreground-muted">Tasks Done</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold">{todayHabitsCompleted}/{habitStats.length}</p>
                <p className="text-xs text-foreground-muted">Habits Done</p>
              </div>
              <Link 
                href="/journal"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                Journal
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-foreground-muted">Active Goals</p>
                <p className="text-2xl font-bold text-foreground">{activeYearlyGoals.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-warning/10">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-foreground-muted">Pending Tasks</p>
                <p className="text-2xl font-bold text-foreground">{pendingTasks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-success/10">
                <Flame className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-foreground-muted">Avg. Habit Streak</p>
                <p className="text-2xl font-bold text-foreground">{avgStreak} days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-info/10">
                <TrendingUp className="w-5 h-5 text-info" />
              </div>
              <div>
                <p className="text-sm text-foreground-muted">Completion Rate</p>
                <p className="text-2xl font-bold text-foreground">{completionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Yearly Goals Progress</CardTitle>
              <Link href="/goals" className="text-sm text-primary hover:underline">
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeYearlyGoals.slice(0, 3).map((goal) => (
              <div key={goal.id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">{goal.title}</span>
                  <Badge variant={(goal.progress ?? 0) >= 50 ? "success" : "warning"}>
                    {goal.progress ?? 0}%
                  </Badge>
                </div>
                <Progress value={goal.progress ?? 0} />
                <div className="flex items-center gap-2 text-xs text-foreground-muted">
                  <span>{goal.monthlyGoals.length} monthly goals</span>
                  <span>·</span>
                  <span>
                    {goal.monthlyGoals.reduce((acc, mg) => acc + mg.weeklyPlans.length, 0)} weekly plans
                  </span>
                </div>
              </div>
            ))}
            {activeYearlyGoals.length === 0 && (
              <p className="text-foreground-muted text-sm">No goals set yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Today&apos;s Habits</CardTitle>
              <Link href="/habits" className="text-sm text-primary hover:underline">
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {habitStats.slice(0, 4).map((habit) => (
              <div
                key={habit.id}
                className="flex items-center justify-between p-3 rounded-lg bg-background-tertiary"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      habit.completedToday ? "bg-success" : "bg-warning"
                    }`}
                  />
                  <span className="font-medium text-foreground">{habit.name}</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-foreground-muted">
                  <Flame className="w-4 h-4 text-warning" />
                  {habit.streak}
                </div>
              </div>
            ))}
            {habits.length === 0 && (
              <p className="text-foreground-muted text-sm">No habits set yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Tasks</CardTitle>
              <Link href="/tasks" className="text-sm text-primary hover:underline">
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3 rounded-lg bg-background-tertiary"
              >
                <div className="flex items-center gap-3">
                  <CheckSquare className="w-4 h-4 text-foreground-muted" />
                  <span className="font-medium text-foreground">{task.title}</span>
                </div>
                <Badge variant={task.priority === "HIGH" ? "danger" : task.priority === "MEDIUM" ? "warning" : "success"}>
                  {task.priority}
                </Badge>
              </div>
            ))}
            {recentTasks.length === 0 && (
              <p className="text-foreground-muted text-sm">All tasks completed!</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Quick Stats</CardTitle>
              <Link href="/analytics" className="text-sm text-primary hover:underline">
                Details
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-foreground-secondary">Completed this week</span>
              <span className="font-semibold text-foreground">{completedThisWeek.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-foreground-secondary">Total tasks</span>
              <span className="font-semibold text-foreground">{totalTasks}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-foreground-secondary">Active habits</span>
              <span className="font-semibold text-foreground">{habits.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-foreground-secondary">Yearly goals</span>
              <span className="font-semibold text-foreground">{activeYearlyGoals.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Goal Hierarchy</CardTitle>
              <Link href="/goals" className="text-sm text-primary hover:underline">
                Manage goals
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {activeYearlyGoals.length > 0 ? (
              <div className="space-y-4">
                {activeYearlyGoals.slice(0, 2).map((yg) => (
                  <div key={yg.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span className="font-semibold">{yg.title}</span>
                      </div>
                      <Badge variant={(yg.progress ?? 0) >= 50 ? "success" : "warning"}>
                        {yg.progress ?? 0}%
                      </Badge>
                    </div>
                    <div className="space-y-2 pl-6">
                      {yg.monthlyGoals.slice(0, 2).map((mg) => (
                        <div key={mg.id} className="flex items-center gap-2 text-sm">
                          <ChevronRight className="w-3 h-3 text-foreground-muted" />
                          <span className="text-foreground-secondary">{mg.title}</span>
                          <span className="text-foreground-muted">({mg.progress}%)</span>
                        </div>
                      ))}
                      {yg.monthlyGoals.length > 2 && (
                        <p className="text-xs text-foreground-muted pl-6">
                          +{yg.monthlyGoals.length - 2} more monthly goals
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-foreground-muted text-sm text-center py-4">
                Create your first yearly goal to get started
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
