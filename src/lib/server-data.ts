import { prisma } from "./prisma";
import { createClient } from "./supabase/server";

export async function getUser() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error("Supabase auth error:", error);
      return null;
    }
    
    if (!user?.email) {
      console.log("No user email from Supabase");
      return null;
    }
    
    let dbUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (!dbUser) {
      console.log("Creating new user for:", user.email);
      dbUser = await prisma.user.create({
        data: {
          email: user.email,
          name: user.user_metadata?.name || user.email.split("@")[0],
        },
      });
    }
    
    return dbUser;
  } catch (error) {
    console.error("getUser error:", error);
    return null;
  }
}
