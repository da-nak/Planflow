import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/server-data";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const partnerId = searchParams.get("partnerId");

  if (!partnerId) {
    return NextResponse.json({ error: "Partner ID required" }, { status: 400 });
  }

  const messages = await prisma.chatMessage.findMany({
    where: {
      OR: [
        { senderId: user.id, receiverId: partnerId },
        { senderId: partnerId, receiverId: user.id },
      ],
    },
    orderBy: { createdAt: "asc" },
  });

  await prisma.chatMessage.updateMany({
    where: {
      senderId: partnerId,
      receiverId: user.id,
      read: false,
    },
    data: { read: true },
  });

  return NextResponse.json({ messages });
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { receiverId, content } = await request.json();

  if (!receiverId || !content) {
    return NextResponse.json({ error: "Receiver and content required" }, { status: 400 });
  }

  const partnership = await prisma.accountabilityPartner.findFirst({
    where: {
      OR: [
        { fromUserId: user.id, toUserId: receiverId },
        { fromUserId: receiverId, toUserId: user.id },
      ],
      status: "ACTIVE",
    },
  });

  if (!partnership) {
    return NextResponse.json({ error: "Not partners with this user" }, { status: 403 });
  }

  const message = await prisma.chatMessage.create({
    data: {
      senderId: user.id,
      receiverId,
      content,
    },
  });

  return NextResponse.json({ message });
}
