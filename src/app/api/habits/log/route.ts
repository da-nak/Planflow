import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { habitId, date, status } = body;

    const habit = await prisma.habit.findUnique({
      where: { id: habitId },
    });

    if (!habit || habit.userId !== session.user.id) {
      return NextResponse.json({ error: "Habit not found" }, { status: 404 });
    }

    const existingLog = await prisma.habitLog.findFirst({
      where: {
        habitId,
        date: {
          gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
          lt: new Date(new Date(date).setHours(23, 59, 59, 999)),
        },
      },
    });

    if (existingLog) {
      const log = await prisma.habitLog.update({
        where: { id: existingLog.id },
        data: { status },
      });
      return NextResponse.json(log);
    }

    const log = await prisma.habitLog.create({
      data: {
        habitId,
        date: new Date(date),
        status: status || "COMPLETED",
      },
    });

    return NextResponse.json(log);
  } catch (error) {
    console.error("Error logging habit:", error);
    return NextResponse.json({ error: "Failed to log habit" }, { status: 500 });
  }
}
