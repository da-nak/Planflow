import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/server-data";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { message } = await request.json();

  const code = randomBytes(8).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const invite = await prisma.accountabilityInvite.create({
    data: {
      code,
      message: message || null,
      fromUserId: user.id,
      expiresAt,
    },
  });

  return NextResponse.json({ invite, code });
}

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sent = await prisma.accountabilityInvite.findMany({
    where: { fromUserId: user.id },
    include: { toUser: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  const received = await prisma.accountabilityInvite.findMany({
    where: { toUserId: user.id, status: "PENDING" },
    include: { fromUser: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ sent, received });
}

export async function DELETE(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const inviteId = searchParams.get("id");

  if (!inviteId) {
    return NextResponse.json({ error: "Invite ID required" }, { status: 400 });
  }

  await prisma.accountabilityInvite.deleteMany({
    where: { id: inviteId, fromUserId: user.id },
  });

  return NextResponse.json({ success: true });
}
