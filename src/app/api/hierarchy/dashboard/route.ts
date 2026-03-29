import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { getHierarchicalData } from "@/lib/data";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await getHierarchicalData(dbUser.id);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching hierarchical data:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
