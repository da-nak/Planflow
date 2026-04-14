import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

async function getUserId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return null;
  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
  });
  return dbUser?.id;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetDate = searchParams.get("targetDate");

    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const where: { userId: string; targetDate?: { gte: Date; lte: Date } } = { userId };
    if (targetDate) {
      const date = new Date(targetDate);
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      where.targetDate = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const dailyTasks = await prisma.dailyTask.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(dailyTasks);
  } catch (error) {
    console.error("Error fetching daily tasks:", error);
    return NextResponse.json({ error: "Failed to fetch daily tasks" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, priority, status, category, targetDate, effortValue } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!targetDate) {
      return NextResponse.json({ error: "Target date is required" }, { status: 400 });
    }

    const dailyTask = await prisma.dailyTask.create({
      data: {
        userId,
        title,
        description,
        priority: priority || "MEDIUM",
        status: status || "PENDING",
        category: category || "OTHER",
        targetDate: new Date(targetDate),
        effortValue: effortValue || 1,
      },
    });

    return NextResponse.json(dailyTask);
  } catch (error) {
    console.error("Error creating daily task:", error);
    return NextResponse.json({ error: "Failed to create daily task" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, description, priority, status, category, targetDate, completedAt, effortValue } = body;

    const dailyTask = await prisma.dailyTask.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(priority && { priority }),
        ...(status && { status }),
        ...(category && { category }),
        ...(targetDate && { targetDate: new Date(targetDate) }),
        ...(completedAt !== undefined && { completedAt: completedAt ? new Date(completedAt) : null }),
        ...(effortValue !== undefined && { effortValue }),
      },
    });

    return NextResponse.json(dailyTask);
  } catch (error) {
    console.error("Error updating daily task:", error);
    return NextResponse.json({ error: "Failed to update daily task" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;

    const completedAt = status === "COMPLETED" ? new Date() : null;

    const dailyTask = await prisma.dailyTask.update({
      where: { id },
      data: {
        status,
        completedAt,
      },
    });

    return NextResponse.json(dailyTask);
  } catch (error) {
    console.error("Error patching daily task:", error);
    return NextResponse.json({ error: "Failed to patch daily task" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Daily task ID required" }, { status: 400 });
    }

    await prisma.dailyTask.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting daily task:", error);
    return NextResponse.json({ error: "Failed to delete daily task" }, { status: 500 });
  }
}
