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
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = { userId };

    if (startDate && endDate) {
      where.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const timeBlocks = await prisma.timeBlock.findMany({
      where,
      orderBy: { startTime: "asc" },
    });

    return NextResponse.json(timeBlocks);
  } catch (error) {
    console.error("Error fetching time blocks:", error);
    return NextResponse.json({ error: "Failed to fetch time blocks" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, category, startTime, endTime, taskId } = body;

    const timeBlock = await prisma.timeBlock.create({
      data: {
        userId,
        title,
        description,
        category: category || "OTHER",
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        taskId: taskId || null,
      },
    });

    return NextResponse.json(timeBlock);
  } catch (error) {
    console.error("Error creating time block:", error);
    return NextResponse.json({ error: "Failed to create time block" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, description, category, startTime, endTime } = body;

    const timeBlock = await prisma.timeBlock.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(category && { category }),
        ...(startTime && { startTime: new Date(startTime) }),
        ...(endTime && { endTime: new Date(endTime) }),
      },
    });

    return NextResponse.json(timeBlock);
  } catch (error) {
    console.error("Error updating time block:", error);
    return NextResponse.json({ error: "Failed to update time block" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Time block ID required" }, { status: 400 });
    }

    await prisma.timeBlock.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting time block:", error);
    return NextResponse.json({ error: "Failed to delete time block" }, { status: 500 });
  }
}
