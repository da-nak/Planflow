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

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const goals = await prisma.yearlyGoal.findMany({
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

    return NextResponse.json(goals);
  } catch (error) {
    console.error("Error fetching yearly goals:", error);
    return NextResponse.json({ error: "Failed to fetch goals" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, deadline, notes } = body;

    const goal = await prisma.yearlyGoal.create({
      data: {
        userId,
        title,
        description,
        deadline: deadline ? new Date(deadline) : null,
        notes,
        status: "ACTIVE",
      },
    });

    return NextResponse.json(goal);
  } catch (error) {
    console.error("Error creating yearly goal:", error);
    return NextResponse.json({ error: "Failed to create goal" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, description, deadline, notes, status } = body;

    const goal = await prisma.yearlyGoal.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
        ...(notes !== undefined && { notes }),
        ...(status && { status }),
      },
    });

    return NextResponse.json(goal);
  } catch (error) {
    console.error("Error updating yearly goal:", error);
    return NextResponse.json({ error: "Failed to update goal" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Goal ID required" }, { status: 400 });
    }

    await prisma.yearlyGoal.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting yearly goal:", error);
    return NextResponse.json({ error: "Failed to delete goal" }, { status: 500 });
  }
}
