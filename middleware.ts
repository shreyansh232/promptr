import { NextResponse } from "next/server";
import { auth } from "auth";

const protectedRoutes = ["/dashboard", "/profile"];
const authRoutes = ["/sign-in", "/sign-up"];

export default auth((request) => {
  const isProtected = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route),
  );
  const isAuthRoute = authRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route),
  );

  if (!request.auth && isProtected) {
    const absoluteURL = new URL("/sign-in", request.nextUrl.origin);
    return NextResponse.redirect(absoluteURL.toString());
  }

  if (request.auth && isAuthRoute) {
    const absoluteURL = new URL("/dashboard", request.nextUrl.origin);
    return NextResponse.redirect(absoluteURL.toString());
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
