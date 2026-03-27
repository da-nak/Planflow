import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const yearlyGoalId = searchParams.get("yearlyGoalId");

    if (!yearlyGoalId) {
      return NextResponse.json({ error: "yearlyGoalId required" }, { status: 400 });
    }

    const monthlyGoals = await prisma.monthlyGoal.findMany({
      where: { yearlyGoalId },
      include: {
        weeklyPlans: {
          include: {
            tasks: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(monthlyGoals);
  } catch (error) {
    console.error("Error fetching monthly goals:", error);
    return NextResponse.json({ error: "Failed to fetch monthly goals" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { yearlyGoalId, title, description, deadline, notes } = body;

    if (!yearlyGoalId) {
      return NextResponse.json({ error: "yearlyGoalId required" }, { status: 400 });
    }

    const monthlyGoal = await prisma.monthlyGoal.create({
      data: {
        yearlyGoalId,
        title,
        description,
        deadline: deadline ? new Date(deadline) : null,
        notes,
        status: "ACTIVE",
      },
    });

    return NextResponse.json(monthlyGoal);
  } catch (error) {
    console.error("Error creating monthly goal:", error);
    return NextResponse.json({ error: "Failed to create monthly goal" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, description, deadline, notes, status } = body;

    const monthlyGoal = await prisma.monthlyGoal.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
        ...(notes !== undefined && { notes }),
        ...(status && { status }),
      },
    });

    return NextResponse.json(monthlyGoal);
  } catch (error) {
    console.error("Error updating monthly goal:", error);
    return NextResponse.json({ error: "Failed to update monthly goal" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Monthly goal ID required" }, { status: 400 });
    }

    await prisma.monthlyGoal.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting monthly goal:", error);
    return NextResponse.json({ error: "Failed to delete monthly goal" }, { status: 500 });
  }
}
