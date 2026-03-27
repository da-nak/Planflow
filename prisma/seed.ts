import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("demo123", 12);

  const user = await prisma.user.upsert({
    where: { email: "demo@planflow.app" },
    update: {},
    create: {
      email: "demo@planflow.app",
      name: "Demo User",
      password: hashedPassword,
    },
  });

  console.log({ user });

  const yearlyGoals = await Promise.all([
    prisma.yearlyGoal.create({
      data: {
        userId: user.id,
        title: "Read 24 books",
        description: "Expand knowledge through reading",
        deadline: new Date("2026-12-31"),
        status: "ACTIVE",
      },
    }),
    prisma.yearlyGoal.create({
      data: {
        userId: user.id,
        title: "Run 500km",
        description: "Improve cardiovascular health",
        deadline: new Date("2026-12-31"),
        status: "ACTIVE",
      },
    }),
    prisma.yearlyGoal.create({
      data: {
        userId: user.id,
        title: "Learn React Native",
        description: "Build mobile apps",
        deadline: new Date("2026-12-31"),
        status: "ACTIVE",
      },
    }),
  ]);

  console.log({ yearlyGoals });

  const monthlyGoals = await Promise.all([
    prisma.monthlyGoal.create({
      data: {
        yearlyGoalId: yearlyGoals[0].id,
        title: "Complete 4 books",
        description: "Focus on non-fiction",
        status: "ACTIVE",
      },
    }),
    prisma.monthlyGoal.create({
      data: {
        yearlyGoalId: yearlyGoals[1].id,
        title: "Run 50km",
        description: "Building running habit",
        status: "ACTIVE",
      },
    }),
    prisma.monthlyGoal.create({
      data: {
        yearlyGoalId: yearlyGoals[2].id,
        title: "Complete React Native course",
        description: "Follow a structured course",
        status: "ACTIVE",
      },
    }),
  ]);

  console.log({ monthlyGoals });

  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1);
  
  const weeklyPlans = await Promise.all([
    prisma.weeklyPlan.create({
      data: {
        monthlyGoalId: monthlyGoals[0].id,
        title: "Week 1 - Reading Sprint",
        description: "Complete first book",
        startDate: startOfWeek,
        endDate: new Date(startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000),
        status: "ACTIVE",
      },
    }),
    prisma.weeklyPlan.create({
      data: {
        monthlyGoalId: monthlyGoals[1].id,
        title: "Week 1 - Running",
        description: "Run 10km this week",
        startDate: startOfWeek,
        endDate: new Date(startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000),
        status: "ACTIVE",
      },
    }),
    prisma.weeklyPlan.create({
      data: {
        monthlyGoalId: monthlyGoals[2].id,
        title: "Week 1 - React Native Basics",
        description: "Complete setup and basics",
        startDate: startOfWeek,
        endDate: new Date(startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000),
        status: "ACTIVE",
      },
    }),
  ]);

  console.log({ weeklyPlans });

  const tasks = await Promise.all([
    prisma.task.create({
      data: {
        weeklyPlanId: weeklyPlans[0].id,
        title: "Read Chapter 1-3",
        description: "From 'Atomic Habits'",
        priority: "HIGH",
        status: "PENDING",
        category: "PERSONAL",
        deadline: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.task.create({
      data: {
        weeklyPlanId: weeklyPlans[0].id,
        title: "Take reading notes",
        description: "Summarize key takeaways",
        priority: "MEDIUM",
        status: "PENDING",
        category: "PERSONAL",
      },
    }),
    prisma.task.create({
      data: {
        weeklyPlanId: weeklyPlans[1].id,
        title: "Morning run - 3km",
        description: "Easy pace run",
        priority: "HIGH",
        status: "PENDING",
        category: "HEALTH",
        deadline: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.task.create({
      data: {
        weeklyPlanId: weeklyPlans[1].id,
        title: "Evening walk - 2km",
        description: "Recovery walk",
        priority: "LOW",
        status: "COMPLETED",
        category: "HEALTH",
        completedAt: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.task.create({
      data: {
        weeklyPlanId: weeklyPlans[2].id,
        title: "Set up Expo project",
        description: "Initialize React Native project",
        priority: "HIGH",
        status: "COMPLETED",
        category: "STUDY",
        completedAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.task.create({
      data: {
        weeklyPlanId: weeklyPlans[2].id,
        title: "Learn navigation basics",
        description: "React Navigation setup",
        priority: "MEDIUM",
        status: "IN_PROGRESS",
        category: "STUDY",
      },
    }),
  ]);

  console.log({ tasks });

  const habits = await Promise.all([
    prisma.habit.create({
      data: {
        userId: user.id,
        name: "Morning Exercise",
        description: "30 minutes of workout",
        category: "HEALTH",
        targetDays: JSON.stringify([1, 2, 3, 4, 5, 6, 0]),
      },
    }),
    prisma.habit.create({
      data: {
        userId: user.id,
        name: "Read 30 minutes",
        description: "Read non-fiction books",
        category: "PERSONAL",
        targetDays: JSON.stringify([1, 2, 3, 4, 5, 6, 0]),
      },
    }),
    prisma.habit.create({
      data: {
        userId: user.id,
        name: "Code Practice",
        description: "Practice coding problems",
        category: "STUDY",
        targetDays: JSON.stringify([1, 2, 3, 4, 5]),
      },
    }),
    prisma.habit.create({
      data: {
        userId: user.id,
        name: "Meditate",
        description: "10 minutes of meditation",
        category: "HEALTH",
        targetDays: JSON.stringify([1, 2, 3, 4, 5, 6, 0]),
      },
    }),
  ]);

  console.log({ habits });

  for (const habit of habits) {
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const targetDays = JSON.parse(habit.targetDays) as number[];
      if (targetDays.includes(date.getDay())) {
        await prisma.habitLog.create({
          data: {
            habitId: habit.id,
            date: date,
            status: i === 0 ? "COMPLETED" : (Math.random() > 0.2 ? "COMPLETED" : "SKIPPED"),
          },
        });
      }
    }
  }

  const habitStartOfWeek = new Date(startOfWeek);
  habitStartOfWeek.setHours(10, 0, 0, 0);

  const timeBlocks = await Promise.all([
    prisma.timeBlock.create({
      data: {
        userId: user.id,
        title: "Team Standup",
        category: "WORK",
        startTime: new Date(habitStartOfWeek.setHours(9, 0, 0, 0)),
        endTime: new Date(habitStartOfWeek.setHours(9, 15, 0, 0)),
        taskId: tasks[5].id,
      },
    }),
    prisma.timeBlock.create({
      data: {
        userId: user.id,
        title: "Deep Work Block",
        category: "WORK",
        startTime: new Date(habitStartOfWeek.setHours(10, 0, 0, 0)),
        endTime: new Date(habitStartOfWeek.setHours(12, 0, 0, 0)),
        taskId: tasks[0].id,
      },
    }),
    prisma.timeBlock.create({
      data: {
        userId: user.id,
        title: "Gym Session",
        category: "HEALTH",
        startTime: new Date(habitStartOfWeek.setHours(18, 0, 0, 0)),
        endTime: new Date(habitStartOfWeek.setHours(19, 0, 0, 0)),
      },
    }),
    prisma.timeBlock.create({
      data: {
        userId: user.id,
        title: "Evening Reading",
        category: "PERSONAL",
        startTime: new Date(habitStartOfWeek.setHours(21, 0, 0, 0)),
        endTime: new Date(habitStartOfWeek.setHours(21, 30, 0, 0)),
      },
    }),
  ]);

  console.log({ timeBlocks });

  console.log("Seed completed successfully");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
