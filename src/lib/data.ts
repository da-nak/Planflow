import { prisma } from "./prisma";
import { auth } from "./auth";

export async function getUser() {
  const session = await auth.api.getSession();
  if (!session?.user?.email) return null;
  
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  return user;
}

export async function getHabits(userId: string) {
  return prisma.habit.findMany({
    where: { userId },
    include: {
      logs: {
        orderBy: { date: "desc" },
        take: 30,
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export type Task = {
  id: string;
  weeklyPlanId: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  effortValue: number;
  deadline: Date | null;
  reminder: Date | null;
  notes: string | null;
  category: string;
  isRecurring: boolean;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
};

export type WeeklyPlan = {
  id: string;
  monthlyGoalId: string;
  title: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
  notes: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  tasks: Task[];
  progress?: number;
  weightedProgress?: number;
  _count?: {
    tasks: number;
  };
};

export type MonthlyGoal = {
  id: string;
  yearlyGoalId: string;
  title: string;
  description: string | null;
  deadline: Date | null;
  notes: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  weeklyPlans: WeeklyPlan[];
  progress?: number;
  weightedProgress?: number;
  _count?: {
    weeklyPlans: number;
  };
};

export type YearlyGoal = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  deadline: Date | null;
  notes: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  monthlyGoals: MonthlyGoal[];
  progress?: number;
  weightedProgress?: number;
  _count?: {
    monthlyGoals: number;
  };
};

export type HierarchicalData = YearlyGoal[];

export function calculateTaskProgress(task: Task): number {
  return task.status === "COMPLETED" ? 1 : 0;
}

export function calculateWeightedTaskProgress(task: Task): number {
  if (task.status !== "COMPLETED") return 0;
  return task.effortValue;
}

export function calculateWeeklyProgress(weeklyPlan: WeeklyPlan): number {
  const totalTasks = weeklyPlan.tasks.length;
  if (totalTasks === 0) return 0;
  
  const completedTasks = weeklyPlan.tasks.filter(t => t.status === "COMPLETED").length;
  return Math.round((completedTasks / totalTasks) * 100);
}

export function calculateWeightedWeeklyProgress(weeklyPlan: WeeklyPlan): number {
  const totalEffort = weeklyPlan.tasks.reduce((sum, t) => sum + t.effortValue, 0);
  if (totalEffort === 0) return 0;
  
  const completedEffort = weeklyPlan.tasks
    .filter(t => t.status === "COMPLETED")
    .reduce((sum, t) => sum + t.effortValue, 0);
  
  return Math.round((completedEffort / totalEffort) * 100);
}

export function calculateMonthlyProgress(monthlyGoal: MonthlyGoal): number {
  const allTasks = monthlyGoal.weeklyPlans.flatMap(wp => wp.tasks);
  const totalTasks = allTasks.length;
  if (totalTasks === 0) return 0;
  
  const completedTasks = allTasks.filter(t => t.status === "COMPLETED").length;
  return Math.round((completedTasks / totalTasks) * 100);
}

export function calculateWeightedMonthlyProgress(monthlyGoal: MonthlyGoal): number {
  const allTasks = monthlyGoal.weeklyPlans.flatMap(wp => wp.tasks);
  const totalEffort = allTasks.reduce((sum, t) => sum + t.effortValue, 0);
  if (totalEffort === 0) return 0;
  
  const completedEffort = allTasks
    .filter(t => t.status === "COMPLETED")
    .reduce((sum, t) => sum + t.effortValue, 0);
  
  return Math.round((completedEffort / totalEffort) * 100);
}

export function calculateYearlyProgress(yearlyGoal: YearlyGoal): number {
  const allTasks = yearlyGoal.monthlyGoals.flatMap(mg => mg.weeklyPlans.flatMap(wp => wp.tasks));
  const totalTasks = allTasks.length;
  if (totalTasks === 0) return 0;
  
  const completedTasks = allTasks.filter(t => t.status === "COMPLETED").length;
  return Math.round((completedTasks / totalTasks) * 100);
}

export function calculateWeightedYearlyProgress(yearlyGoal: YearlyGoal): number {
  const allTasks = yearlyGoal.monthlyGoals.flatMap(mg => mg.weeklyPlans.flatMap(wp => wp.tasks));
  const totalEffort = allTasks.reduce((sum, t) => sum + t.effortValue, 0);
  if (totalEffort === 0) return 0;
  
  const completedEffort = allTasks
    .filter(t => t.status === "COMPLETED")
    .reduce((sum, t) => sum + t.effortValue, 0);
  
  return Math.round((completedEffort / totalEffort) * 100);
}

export function enrichWithProgress(data: HierarchicalData): HierarchicalData {
  return data.map(yearlyGoal => ({
    ...yearlyGoal,
    progress: calculateYearlyProgress(yearlyGoal),
    weightedProgress: calculateWeightedYearlyProgress(yearlyGoal),
    monthlyGoals: yearlyGoal.monthlyGoals.map(monthlyGoal => ({
      ...monthlyGoal,
      progress: calculateMonthlyProgress(monthlyGoal),
      weightedProgress: calculateWeightedMonthlyProgress(monthlyGoal),
      weeklyPlans: monthlyGoal.weeklyPlans.map(weeklyPlan => ({
        ...weeklyPlan,
        progress: calculateWeeklyProgress(weeklyPlan),
        weightedProgress: calculateWeightedWeeklyProgress(weeklyPlan),
      })),
    })),
  }));
}

export async function getHierarchicalData(userId: string): Promise<HierarchicalData> {
  const yearlyGoals = await prisma.yearlyGoal.findMany({
    where: { userId },
    include: {
      monthlyGoals: {
        include: {
          weeklyPlans: {
            include: {
              tasks: true,
            },
            orderBy: { startDate: "asc" },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return enrichWithProgress(yearlyGoals);
}

export async function getYearlyGoals(userId: string) {
  return prisma.yearlyGoal.findMany({
    where: { userId },
    include: {
      monthlyGoals: {
        include: {
          weeklyPlans: {
            include: {
              tasks: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getMonthlyGoals(yearlyGoalId: string) {
  return prisma.monthlyGoal.findMany({
    where: { yearlyGoalId },
    include: {
      weeklyPlans: {
        include: {
          tasks: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getWeeklyPlans(monthlyGoalId: string) {
  return prisma.weeklyPlan.findMany({
    where: { monthlyGoalId },
    include: {
      tasks: true,
    },
    orderBy: { startDate: "asc" },
  });
}

export async function getTasks(weeklyPlanId?: string) {
  if (weeklyPlanId) {
    return prisma.task.findMany({
      where: { weeklyPlanId },
      orderBy: { createdAt: "desc" },
    });
  }
  return prisma.task.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function getAllTasksForUser(userId: string) {
  return prisma.task.findMany({
    where: {
      weeklyPlan: {
        monthlyGoal: {
          yearlyGoal: {
            userId,
          },
        },
      },
    },
    include: {
      weeklyPlan: {
        include: {
          monthlyGoal: {
            include: {
              yearlyGoal: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createYearlyGoal(data: {
  userId: string;
  title: string;
  description?: string;
  deadline?: Date;
  notes?: string;
}) {
  return prisma.yearlyGoal.create({ data });
}

export async function updateYearlyGoal(id: string, data: {
  title?: string;
  description?: string;
  deadline?: Date;
  notes?: string;
  status?: string;
}) {
  return prisma.yearlyGoal.update({ where: { id }, data });
}

export async function deleteYearlyGoal(id: string) {
  return prisma.yearlyGoal.delete({ where: { id } });
}

export async function createMonthlyGoal(data: {
  yearlyGoalId: string;
  title: string;
  description?: string;
  deadline?: Date;
  notes?: string;
}) {
  return prisma.monthlyGoal.create({ data });
}

export async function updateMonthlyGoal(id: string, data: {
  title?: string;
  description?: string;
  deadline?: Date;
  notes?: string;
  status?: string;
}) {
  return prisma.monthlyGoal.update({ where: { id }, data });
}

export async function deleteMonthlyGoal(id: string) {
  return prisma.monthlyGoal.delete({ where: { id } });
}

export async function createWeeklyPlan(data: {
  monthlyGoalId: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  notes?: string;
}) {
  return prisma.weeklyPlan.create({ data });
}

export async function updateWeeklyPlan(id: string, data: {
  title?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  notes?: string;
  status?: string;
}) {
  return prisma.weeklyPlan.update({ where: { id }, data });
}

export async function deleteWeeklyPlan(id: string) {
  return prisma.weeklyPlan.delete({ where: { id } });
}

export async function createTask(data: {
  weeklyPlanId: string;
  title: string;
  description?: string;
  priority?: string;
  status?: string;
  category?: string;
  deadline?: Date;
  isRecurring?: boolean;
  effortValue?: number;
}) {
  return prisma.task.create({ data });
}

export async function updateTask(id: string, data: {
  title?: string;
  description?: string;
  priority?: string;
  status?: string;
  category?: string;
  deadline?: Date;
  completedAt?: Date | null;
  isRecurring?: boolean;
  effortValue?: number;
}) {
  return prisma.task.update({ where: { id }, data });
}

export async function deleteTask(id: string) {
  return prisma.task.delete({ where: { id } });
}

export async function completeTask(id: string) {
  return prisma.task.update({
    where: { id },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
    },
  });
}

export async function uncompleteTask(id: string) {
  return prisma.task.update({
    where: { id },
    data: {
      status: "PENDING",
      completedAt: null,
    },
  });
}

export async function getHabits(userId: string) {
  return prisma.habit.findMany({
    where: { userId },
    include: {
      logs: {
        orderBy: { date: "desc" },
        take: 30,
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getTimeBlocks(userId: string, startDate: Date, endDate: Date) {
  return prisma.timeBlock.findMany({
    where: {
      userId,
      startTime: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      task: true,
    },
    orderBy: { startTime: "asc" },
  });
}

export async function createHabit(data: {
  userId: string;
  name: string;
  description?: string;
  category?: string;
  targetDays: string;
}) {
  return prisma.habit.create({ data });
}

export async function updateHabit(id: string, data: {
  name?: string;
  description?: string;
  category?: string;
  targetDays?: string;
}) {
  return prisma.habit.update({ where: { id }, data });
}

export async function deleteHabit(id: string) {
  return prisma.habit.delete({ where: { id } });
}

export async function createHabitLog(habitId: string, date: Date, status: string) {
  return prisma.habitLog.create({
    data: { habitId, date, status },
  });
}

export async function createTimeBlock(data: {
  userId: string;
  title: string;
  description?: string;
  category?: string;
  startTime: Date;
  endTime: Date;
  taskId?: string;
}) {
  return prisma.timeBlock.create({ data });
}

export async function updateTimeBlock(id: string, data: {
  title?: string;
  description?: string;
  category?: string;
  startTime?: Date;
  endTime?: Date;
}) {
  return prisma.timeBlock.update({ where: { id }, data });
}

export async function deleteTimeBlock(id: string) {
  return prisma.timeBlock.delete({ where: { id } });
}

export function calculateStreak(logs: { date: Date; status: string }[]) {
  if (logs.length === 0) return 0;
  
  const completedLogs = logs.filter(l => l.status === "COMPLETED");
  if (completedLogs.length === 0) return 0;
  
  const sortedLogs = completedLogs.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < sortedLogs.length; i++) {
    const logDate = new Date(sortedLogs[i].date);
    logDate.setHours(0, 0, 0, 0);
    
    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - i);
    
    if (logDate.getTime() === expectedDate.getTime()) {
      streak++;
    } else if (i === 0 && logDate.getTime() === expectedDate.getTime() - 86400000) {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      if (logDate.getTime() === yesterday.getTime()) {
        streak++;
      }
    } else {
      break;
    }
  }
  
  return streak;
}

export function getCategoryColor(category: string) {
  const colors: Record<string, string> = {
    WORK: "#6366F1",
    STUDY: "#8B5CF6",
    HEALTH: "#22C55E",
    PERSONAL: "#F59E0B",
    SOCIAL: "#EC4899",
    OTHER: "#6B7280",
  };
  return colors[category] || colors.OTHER;
}

export function getPriorityColor(priority: string) {
  const colors: Record<string, string> = {
    HIGH: "#EF4444",
    MEDIUM: "#F59E0B",
    LOW: "#22C55E",
  };
  return colors[priority] || colors.MEDIUM;
}

export type AnalyticsData = {
  taskCompletionRate: number;
  habitConsistency: number;
  productivityScore: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  tasksByCategory: Record<string, number>;
  tasksByPriority: Record<string, number>;
  dailyTaskData: { date: string; completed: number; created: number }[];
  weeklyProgress: { week: string; progress: number }[];
  categoryBreakdown: { category: string; completed: number; total: number }[];
};

export async function getAnalyticsData(
  userId: string, 
  startDate: Date, 
  endDate: Date
): Promise<AnalyticsData> {
  const tasks = await prisma.task.findMany({
    where: {
      weeklyPlan: {
        monthlyGoal: {
          yearlyGoal: {
            userId,
          },
        },
      },
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      weeklyPlan: {
        include: {
          monthlyGoal: {
            include: {
              yearlyGoal: true,
            },
          },
        },
      },
    },
  });

  const habits = await prisma.habit.findMany({
    where: { userId },
    include: {
      logs: {
        where: {
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
    },
  });

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === "COMPLETED").length;
  const pendingTasks = tasks.filter(t => t.status === "PENDING").length;
  const inProgressTasks = tasks.filter(t => t.status === "IN_PROGRESS").length;

  const taskCompletionRate = totalTasks > 0 
    ? Math.round((completedTasks / totalTasks) * 100) 
    : 0;

  const tasksByCategory: Record<string, number> = {};
  const tasksByPriority: Record<string, number> = {};
  
  tasks.forEach(task => {
    tasksByCategory[task.category] = (tasksByCategory[task.category] || 0) + 1;
    tasksByPriority[task.priority] = (tasksByPriority[task.priority] || 0) + 1;
  });

  const habitConsistency = calculateHabitConsistency(habits, startDate, endDate);

  const productivityScore = Math.round(
    (taskCompletionRate * 0.5) + (habitConsistency * 0.3) + (inProgressTasks > 0 ? 20 : 0) + 10
  );

  const dailyTaskData = calculateDailyTaskData(tasks, startDate, endDate);
  
  const weeklyProgress = calculateWeeklyProgressData(tasks, startDate, endDate);
  
  const categoryBreakdown = calculateCategoryBreakdown(tasks);

  return {
    taskCompletionRate,
    habitConsistency,
    productivityScore,
    totalTasks,
    completedTasks,
    pendingTasks,
    inProgressTasks,
    tasksByCategory,
    tasksByPriority,
    dailyTaskData,
    weeklyProgress,
    categoryBreakdown,
  };
}

function calculateHabitConsistency(
  habits: Array<{ targetDays: string; logs: Array<{ date: Date; status: string }> }>,
  startDate: Date,
  endDate: Date
): number {
  if (habits.length === 0) return 0;

  let totalExpected = 0;
  let totalCompleted = 0;

  habits.forEach(habit => {
    const targetDays = JSON.parse(habit.targetDays) as number[];
    const logsMap = new Map(
      habit.logs.map(l => [new Date(l.date).toISOString().split('T')[0], l.status])
    );

    const current = new Date(startDate);
    while (current <= endDate) {
      if (targetDays.includes(current.getDay())) {
        totalExpected++;
        const dateKey = current.toISOString().split('T')[0];
        if (logsMap.get(dateKey) === "COMPLETED") {
          totalCompleted++;
        }
      }
      current.setDate(current.getDate() + 1);
    }
  });

  return totalExpected > 0 ? Math.round((totalCompleted / totalExpected) * 100) : 0;
}

function calculateDailyTaskData(
  tasks: Array<{ createdAt: Date; completedAt: Date | null; status: string }>,
  startDate: Date,
  endDate: Date
): { date: string; completed: number; created: number }[] {
  const dailyMap = new Map<string, { completed: number; created: number }>();
  
  const current = new Date(startDate);
  while (current <= endDate) {
    const dateKey = current.toISOString().split('T')[0];
    dailyMap.set(dateKey, { completed: 0, created: 0 });
    current.setDate(current.getDate() + 1);
  }

  tasks.forEach(task => {
    const createdDate = new Date(task.createdAt).toISOString().split('T')[0];
    const data = dailyMap.get(createdDate);
    if (data) data.created++;

    if (task.completedAt) {
      const completedDate = new Date(task.completedAt).toISOString().split('T')[0];
      const completedData = dailyMap.get(completedDate);
      if (completedData) completedData.completed++;
    }
  });

  return Array.from(dailyMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function calculateWeeklyProgressData(
  tasks: Array<{ createdAt: Date; completedAt: Date | null; status: string }>,
  startDate: Date,
  endDate: Date
): { week: string; progress: number }[] {
  const weeklyMap = new Map<string, { total: number; completed: number }>();
  
  const current = new Date(startDate);
  let weekNum = 1;
  while (current <= endDate) {
    const weekKey = `Week ${weekNum}`;
    weeklyMap.set(weekKey, { total: 0, completed: 0 });
    current.setDate(current.getDate() + 7);
    weekNum++;
  }

  tasks.forEach(task => {
    const taskDate = new Date(task.createdAt);
    const daysDiff = Math.floor((taskDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const weekIndex = Math.floor(daysDiff / 7);
    const weekKey = `Week ${weekIndex + 1}`;
    const data = weeklyMap.get(weekKey);
    if (data) {
      data.total++;
      if (task.status === "COMPLETED") {
        data.completed++;
      }
    }
  });

  return Array.from(weeklyMap.entries())
    .map(([week, data]) => ({
      week,
      progress: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
    }));
}

function calculateCategoryBreakdown(
  tasks: Array<{ category: string; status: string }>
): { category: string; completed: number; total: number }[] {
  const categoryMap = new Map<string, { completed: number; total: number }>();

  tasks.forEach(task => {
    const data = categoryMap.get(task.category) || { completed: 0, total: 0 };
    data.total++;
    if (task.status === "COMPLETED") {
      data.completed++;
    }
    categoryMap.set(task.category, data);
  });

  return Array.from(categoryMap.entries())
    .map(([category, data]) => ({ category, ...data }))
    .sort((a, b) => b.total - a.total);
}
