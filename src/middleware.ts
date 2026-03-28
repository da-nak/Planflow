import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  let session = null;
  try {
    session = await auth.api.getSession({
      headers: await headers()
    });
  } catch {
    // Session check failed, treat as not logged in
  }

  const isLoggedIn = !!session;
  const isOnLoginPage = request.nextUrl.pathname.startsWith("/login");
  const isOnRegisterPage = request.nextUrl.pathname.startsWith("/register");
  const isOnAuthPages = isOnLoginPage || isOnRegisterPage;

  if (!isLoggedIn && !isOnAuthPages) {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  if (isLoggedIn && isOnAuthPages) {
    return NextResponse.redirect(new URL("/", request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  runtime: "nodejs",
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
