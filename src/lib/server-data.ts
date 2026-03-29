import { prisma } from "./prisma";
import { createClient } from "./supabase/server";

export async function getUser() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return null;
    
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
    });
    return dbUser;
  } catch {
    return null;
  }
}
