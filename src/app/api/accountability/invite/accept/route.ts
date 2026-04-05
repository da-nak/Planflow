import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/server-data";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const inviteId = searchParams.get("id");

  if (!inviteId) {
    return NextResponse.json({ error: "Invite ID required" }, { status: 400 });
  }

  const invite = await prisma.accountabilityInvite.findUnique({
    where: { id: inviteId },
  });

  if (!invite) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  if (invite.toUserId && invite.toUserId !== user.id) {
    return NextResponse.json({ error: "Invite is for someone else" }, { status: 403 });
  }

  if (invite.status === "ACCEPTED") {
    return NextResponse.json({ error: "Invite already accepted" }, { status: 400 });
  }

  if (new Date() > invite.expiresAt) {
    return NextResponse.json({ error: "Invite expired" }, { status: 400 });
  }

  if (invite.fromUserId === user.id) {
    return NextResponse.json({ error: "Cannot accept your own invite" }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.accountabilityInvite.update({
      where: { id: inviteId },
      data: { 
        toUserId: user.id,
        status: "ACCEPTED" 
      },
    });

    await tx.accountabilityPartner.create({
      data: {
        fromUserId: invite.fromUserId,
        toUserId: user.id,
      },
    });

    await tx.accountabilityPartner.create({
      data: {
        fromUserId: user.id,
        toUserId: invite.fromUserId,
      },
    });
  });

  return NextResponse.json({ success: true });
}
