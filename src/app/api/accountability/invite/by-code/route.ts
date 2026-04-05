import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/server-data";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Code required" }, { status: 400 });
  }

  const invite = await prisma.accountabilityInvite.findUnique({
    where: { code },
    include: {
      fromUser: { select: { name: true, email: true } },
    },
  });

  if (!invite) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  return NextResponse.json({ invite });
}
