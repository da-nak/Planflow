import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/server-data";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const entry = await prisma.journalEntry.findFirst({
    where: { id, userId: user.id },
  });

  if (!entry) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  return NextResponse.json({ entry });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.journalEntry.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  const entry = await prisma.journalEntry.update({
    where: { id },
    data: {
      title: body.title !== undefined ? body.title : existing.title,
      content: body.content !== undefined ? body.content : existing.content,
      mood: body.mood !== undefined ? body.mood : existing.mood,
      tags: body.tags !== undefined ? JSON.stringify(body.tags) : existing.tags,
      promptAccomplishments: body.promptAccomplishments !== undefined ? body.promptAccomplishments : existing.promptAccomplishments,
      promptWentWell: body.promptWentWell !== undefined ? body.promptWentWell : existing.promptWentWell,
      promptDidntGoWell: body.promptDidntGoWell !== undefined ? body.promptDidntGoWell : existing.promptDidntGoWell,
      promptImproveTomorrow: body.promptImproveTomorrow !== undefined ? body.promptImproveTomorrow : existing.promptImproveTomorrow,
      completedTaskIds: body.completedTaskIds !== undefined ? JSON.stringify(body.completedTaskIds) : existing.completedTaskIds,
      missedTaskIds: body.missedTaskIds !== undefined ? JSON.stringify(body.missedTaskIds) : existing.missedTaskIds,
    },
  });

  return NextResponse.json({ entry });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.journalEntry.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  await prisma.journalEntry.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
