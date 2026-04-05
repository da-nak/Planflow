import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/server-data";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { duration, type, taskId, taskTitle } = await request.json();

  const session = await prisma.focusSession.create({
    data: {
      userId: user.id,
      duration: duration || 25,
      type: type || "work",
      taskId,
      taskTitle,
      completedAt: new Date(),
    },
  });

  return NextResponse.json({ success: true, session });
}

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const sessions = await prisma.focusSession.findMany({
    where: {
      userId: user.id,
      startedAt: { gte: weekAgo },
    },
    orderBy: { startedAt: "desc" },
  });

  const totalMinutes = sessions.reduce((acc, s) => acc + s.duration, 0);
  const workSessions = sessions.filter((s) => s.type === "work").length;

  return NextResponse.json({ sessions, totalMinutes, workSessions });
}
