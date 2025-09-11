import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const protectedRoutes = ["/profile", "/orders", "/dashboard"];

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;

  // If the path is protected and user has no token → redirect to login
  if (protectedRoutes.some((route) => req.nextUrl.pathname.startsWith(route))) {
    if (!token) {
      const loginUrl = new URL("/login", req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/profile", "/orders", "/dashboard"], // Pages to protect
};
