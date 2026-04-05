import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/server-data";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const partners = await prisma.accountabilityPartner.findMany({
    where: { fromUserId: user.id, status: "ACTIVE" },
    include: {
      toUser: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  const partnersWithStats = await Promise.all(
    partners.map(async (partner) => {
      const partnerId = partner.toUser.id;

      const [tasks, completionLogs, habitLogs] = await Promise.all([
        prisma.task.findMany({
          where: {
            weeklyPlan: {
              monthlyGoal: {
                yearlyGoal: { userId: partnerId },
              },
            },
            completedAt: { gte: today },
          },
          select: { id: true, title: true, status: true },
        }),

        prisma.taskCompletionLog.findMany({
          where: {
            userId: partnerId,
            actualCompletionTime: { gte: weekAgo },
          },
        }),

        prisma.habitLog.findMany({
          where: {
            habit: { userId: partnerId },
            date: { gte: today },
            status: "COMPLETED",
          },
        }),
      ]);

      const completedToday = tasks.filter(t => t.status === "COMPLETED").length;
      const weeklyCompleted = completionLogs.length;

      let streak = 0;
      let checkDate = new Date(today);
      while (checkDate >= weekAgo) {
        const hasLog = habitLogs.some(log => {
          const logDate = new Date(log.date);
          return logDate.toDateString() === checkDate.toDateString();
        });
        if (hasLog) streak++;
        else if (streak > 0) break;
        checkDate.setDate(checkDate.getDate() - 1);
      }

      return {
        id: partner.toUser.id,
        name: partner.toUser.name,
        email: partner.toUser.email,
        stats: {
          completedToday,
          weeklyCompleted,
          streak,
        },
      };
    })
  );

  return NextResponse.json({ partners: partnersWithStats });
}

export async function DELETE(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const partnerId = searchParams.get("id");

  if (!partnerId) {
    return NextResponse.json({ error: "Partner ID required" }, { status: 400 });
  }

  await prisma.accountabilityPartner.deleteMany({
    where: {
      OR: [
        { fromUserId: user.id, toUserId: partnerId },
        { fromUserId: partnerId, toUserId: user.id },
      ],
    },
  });

  return NextResponse.json({ success: true });
}
