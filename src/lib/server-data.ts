import { prisma } from "./prisma";
import { createClient } from "./supabase/server";

export async function getUser() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return null;
    
    let dbUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          email: user.email,
          name: user.user_metadata?.name || user.email.split("@")[0],
        },
      });
    }
    
    return dbUser;
  } catch {
    return null;
  }
}
