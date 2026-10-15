import { NextResponse, type NextRequest } from "next/server";
import { isSessionValue, sessionCookieName } from "@/lib/session";

export async function proxy(request: NextRequest) {
  const signedIn = await isSessionValue(request.cookies.get(sessionCookieName())?.value);
  const { pathname } = request.nextUrl;

  if (pathname === "/logo") {
    return NextResponse.next();
  }

  if (pathname === "/welcome") {
    return NextResponse.next();
  }

  if (pathname === "/login" || pathname.startsWith("/login/")) {
    if (signedIn) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  }

  if (!signedIn) {
    return NextResponse.redirect(new URL("/welcome", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|icon-192.png|icon-512.png).*)"],
};
