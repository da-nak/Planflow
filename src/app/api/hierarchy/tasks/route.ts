import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

async function getUserId() {
  const session = await auth();
  if (!session?.user?.email) return null;
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  return user?.id;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const weeklyPlanId = searchParams.get("weeklyPlanId");
    const monthlyGoalId = searchParams.get("monthlyGoalId");
    const yearlyGoalId = searchParams.get("yearlyGoalId");

    if (weeklyPlanId) {
      const tasks = await prisma.task.findMany({
        where: { weeklyPlanId },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(tasks);
    }

    if (monthlyGoalId) {
      const tasks = await prisma.task.findMany({
        where: {
          weeklyPlan: {
            monthlyGoalId,
          },
        },
        include: {
          weeklyPlan: true,
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(tasks);
    }

    if (yearlyGoalId) {
      const tasks = await prisma.task.findMany({
        where: {
          weeklyPlan: {
            monthlyGoal: {
              yearlyGoalId,
            },
          },
        },
        include: {
          weeklyPlan: {
            include: {
              monthlyGoal: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(tasks);
    }

    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tasks = await prisma.task.findMany({
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

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { weeklyPlanId, title, description, priority, status, category, deadline, isRecurring, effortValue } = body;

    if (!weeklyPlanId) {
      return NextResponse.json({ error: "weeklyPlanId is required" }, { status: 400 });
    }

    const weeklyPlan = await prisma.weeklyPlan.findUnique({
      where: { id: weeklyPlanId },
      include: { monthlyGoal: true },
    });

    if (!weeklyPlan) {
      return NextResponse.json({ error: "Weekly plan not found" }, { status: 404 });
    }

    const task = await prisma.task.create({
      data: {
        weeklyPlanId,
        title,
        description,
        priority: priority || "MEDIUM",
        status: status || "PENDING",
        category: category || "OTHER",
        deadline: deadline ? new Date(deadline) : null,
        isRecurring: isRecurring || false,
        effortValue: effortValue || 1,
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, description, priority, status, category, deadline, isRecurring, effortValue, completedAt } = body;

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(priority && { priority }),
        ...(status && { status }),
        ...(category && { category }),
        ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
        ...(isRecurring !== undefined && { isRecurring }),
        ...(effortValue !== undefined && { effortValue }),
        ...(completedAt !== undefined && { completedAt: completedAt ? new Date(completedAt) : null }),
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;

    const completedAt = status === "COMPLETED" ? new Date() : null;

    const task = await prisma.task.update({
      where: { id },
      data: {
        status,
        completedAt,
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("Error patching task:", error);
    return NextResponse.json({ error: "Failed to patch task" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Task ID required" }, { status: 400 });
    }

    await prisma.task.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
