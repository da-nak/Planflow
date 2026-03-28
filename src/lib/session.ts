import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function getSession() {
  try {
    if (typeof window !== "undefined") {
      return await auth.api.getSession({
        headers: new Headers({ cookie: document.cookie }),
      });
    }
    return await auth.api.getSession({
      headers: await headers()
    });
  } catch {
    return null;
  }
}

export async function requireAuth() {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session;
}
