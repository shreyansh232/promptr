import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = ["/profile", "/missions", "/lab"];
const authRoutes = ["/sign-in", "/sign-up"];

export function middleware(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value;

  const isProtected = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route),
  );
  const isAuthRoute = authRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route),
  );

  if (!token && isProtected) {
    const absoluteURL = new URL("/sign-in", request.nextUrl.origin);
    return NextResponse.redirect(absoluteURL.toString());
  }

  if (token && isAuthRoute) {
    const absoluteURL = new URL("/", request.nextUrl.origin);
    return NextResponse.redirect(absoluteURL.toString());
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
