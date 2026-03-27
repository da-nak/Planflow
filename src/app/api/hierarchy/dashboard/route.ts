import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getHierarchicalData, enrichWithProgress } from "@/lib/data";

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

    const data = await getHierarchicalData(userId);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching hierarchical data:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
