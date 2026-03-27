import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const monthlyGoalId = searchParams.get("monthlyGoalId");

    if (!monthlyGoalId) {
      return NextResponse.json({ error: "monthlyGoalId required" }, { status: 400 });
    }

    const weeklyPlans = await prisma.weeklyPlan.findMany({
      where: { monthlyGoalId },
      include: {
        tasks: true,
      },
      orderBy: { startDate: "asc" },
    });

    return NextResponse.json(weeklyPlans);
  } catch (error) {
    console.error("Error fetching weekly plans:", error);
    return NextResponse.json({ error: "Failed to fetch weekly plans" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { monthlyGoalId, title, description, startDate, endDate, notes } = body;

    if (!monthlyGoalId) {
      return NextResponse.json({ error: "monthlyGoalId required" }, { status: 400 });
    }

    if (!startDate || !endDate) {
      return NextResponse.json({ error: "startDate and endDate required" }, { status: 400 });
    }

    const weeklyPlan = await prisma.weeklyPlan.create({
      data: {
        monthlyGoalId,
        title,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        notes,
        status: "ACTIVE",
      },
    });

    return NextResponse.json(weeklyPlan);
  } catch (error) {
    console.error("Error creating weekly plan:", error);
    return NextResponse.json({ error: "Failed to create weekly plan" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, description, startDate, endDate, notes, status } = body;

    const weeklyPlan = await prisma.weeklyPlan.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(notes !== undefined && { notes }),
        ...(status && { status }),
      },
    });

    return NextResponse.json(weeklyPlan);
  } catch (error) {
    console.error("Error updating weekly plan:", error);
    return NextResponse.json({ error: "Failed to update weekly plan" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Weekly plan ID required" }, { status: 400 });
    }

    await prisma.weeklyPlan.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting weekly plan:", error);
    return NextResponse.json({ error: "Failed to delete weekly plan" }, { status: 500 });
  }
}
