import { prisma } from "./prisma";
import { auth } from "./auth";
import { headers } from "next/headers";

export async function getUser() {
  try {
    const headerList = await headers();
    const session = await auth.api.getSession({
      headers: headerList
    });
    if (!session?.user?.email) return null;
    
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    return user;
  } catch {
    return null;
  }
}
