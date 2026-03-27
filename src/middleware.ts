import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isOnLoginPage = req.nextUrl.pathname.startsWith("/login");
  const isOnRegisterPage = req.nextUrl.pathname.startsWith("/register");
  const isOnAuthPages = isOnLoginPage || isOnRegisterPage;

  if (!isLoggedIn && !isOnAuthPages) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (isLoggedIn && isOnAuthPages) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
