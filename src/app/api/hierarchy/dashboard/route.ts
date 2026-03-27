import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getHierarchicalData } from "@/lib/data";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: new Headers(request.headers) });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await import("@/lib/prisma").then(m => m.prisma.user.findUnique({
      where: { email: session.user.email! },
    }));

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await getHierarchicalData(user.id);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching hierarchical data:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
