import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/server-data";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { taskId, scheduledTime } = await request.json();

  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      weeklyPlan: {
        monthlyGoal: {
          yearlyGoal: {
            userId: user.id,
          },
        },
      },
    },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const now = new Date();
  let completionDelayMinutes: number | null = null;

  if (scheduledTime) {
    const scheduled = new Date(scheduledTime);
    completionDelayMinutes = (now.getTime() - scheduled.getTime()) / (1000 * 60);
  }

  const log = await prisma.taskCompletionLog.create({
    data: {
      userId: user.id,
      taskId,
      scheduledTime: scheduledTime ? new Date(scheduledTime) : null,
      actualCompletionTime: now,
      completionDelayMinutes,
      completionHour: now.getHours(),
      completionDayOfWeek: now.getDay(),
    },
  });

  return NextResponse.json(log);
}
