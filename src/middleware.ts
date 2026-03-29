import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function middleware(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      console.error("Middleware auth error:", error);
    }

    const isLoggedIn = !!user;
    const isOnLoginPage = request.nextUrl.pathname.startsWith("/login");
    const isOnRegisterPage = request.nextUrl.pathname.startsWith("/register");
    const isOnAuthPages = isOnLoginPage || isOnRegisterPage;

    if (!isLoggedIn && !isOnAuthPages) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (isLoggedIn && isOnAuthPages) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
