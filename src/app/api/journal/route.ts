import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/server-data";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const limit = parseInt(searchParams.get("limit") || "30");

  const where: any = { userId: user.id };
  
  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    where.createdAt = { gte: startOfDay, lte: endOfDay };
  }

  const entries = await prisma.journalEntry.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json({ entries });
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    title,
    content,
    mood,
    tags,
    promptAccomplishments,
    promptWentWell,
    promptDidntGoWell,
    promptImproveTomorrow,
    completedTaskIds,
    missedTaskIds,
  } = body;

  if (!content || content.trim() === "") {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  const entry = await prisma.journalEntry.create({
    data: {
      userId: user.id,
      title: title || null,
      content,
      mood: mood || 3,
      tags: JSON.stringify(tags || []),
      promptAccomplishments: promptAccomplishments || null,
      promptWentWell: promptWentWell || null,
      promptDidntGoWell: promptDidntGoWell || null,
      promptImproveTomorrow: promptImproveTomorrow || null,
      completedTaskIds: JSON.stringify(completedTaskIds || []),
      missedTaskIds: JSON.stringify(missedTaskIds || []),
    },
  });

  return NextResponse.json({ entry });
}
