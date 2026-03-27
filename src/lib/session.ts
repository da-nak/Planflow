import { auth } from "@/lib/auth";

export async function getSession() {
  return await auth.api.getSession({
    headers: typeof window !== "undefined" 
      ? new Headers({ cookie: document.cookie }) 
      : undefined,
  });
}

export async function requireAuth() {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session;
}
