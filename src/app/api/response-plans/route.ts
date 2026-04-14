import { NextRequest, NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const challengeId = searchParams.get("challengeId");

    const { prisma } = await import("@/lib/prisma");
    
    if (challengeId) {
      const responsePlan = await prisma.responsePlan.findUnique({
        where: { challengeId },
      });
      return NextResponse.json(responsePlan);
    }

    const responsePlans = await prisma.responsePlan.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(responsePlans);
  } catch (error) {
    console.error("Error fetching response plans:", error);
    return NextResponse.json({ error: "Failed to fetch response plans" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { challengeId, title, description, steps, deadline } = body;

    if (!challengeId) {
      return NextResponse.json({ error: "Challenge ID is required" }, { status: 400 });
    }

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const { prisma } = await import("@/lib/prisma");

    const existingPlan = await prisma.responsePlan.findUnique({
      where: { challengeId },
    });

    if (existingPlan) {
      return NextResponse.json({ error: "Response plan already exists for this challenge" }, { status: 400 });
    }

    const responsePlan = await prisma.responsePlan.create({
      data: {
        challengeId,
        title,
        description,
        steps: JSON.stringify(steps || []),
        deadline: deadline ? new Date(deadline) : null,
        status: "PENDING",
        progress: 0,
      },
    });

    return NextResponse.json(responsePlan);
  } catch (error) {
    console.error("Error creating response plan:", error);
    return NextResponse.json({ error: "Failed to create response plan" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, description, steps, deadline, status, progress } = body;

    const { prisma } = await import("@/lib/prisma");

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (steps !== undefined) updateData.steps = JSON.stringify(steps);
    if (deadline !== undefined) updateData.deadline = deadline ? new Date(deadline) : null;
    if (status !== undefined) updateData.status = status;
    if (progress !== undefined) updateData.progress = progress;

    const responsePlan = await prisma.responsePlan.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(responsePlan);
  } catch (error) {
    console.error("Error updating response plan:", error);
    return NextResponse.json({ error: "Failed to update response plan" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, progress } = body;

    const { prisma } = await import("@/lib/prisma");

    const updateData: Record<string, unknown> = {};
    if (status !== undefined) {
      updateData.status = status;
      if (status === "COMPLETED") {
        updateData.progress = 100;
        updateData.completedAt = new Date();
      }
    }
    if (progress !== undefined) {
      updateData.progress = progress;
    }

    const responsePlan = await prisma.responsePlan.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(responsePlan);
  } catch (error) {
    console.error("Error patching response plan:", error);
    return NextResponse.json({ error: "Failed to patch response plan" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Response plan ID required" }, { status: 400 });
    }

    const { prisma } = await import("@/lib/prisma");

    await prisma.responsePlan.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting response plan:", error);
    return NextResponse.json({ error: "Failed to delete response plan" }, { status: 500 });
  }
}
