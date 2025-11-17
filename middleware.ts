import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  if (!req.auth) {
    return NextResponse.redirect(new URL("/auth/signin", req.url));
  }
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/properties/:path*",
    "/reports/:path*",
    "/content-groups/:path*",
    "/topic-clusters/:path*",
    "/annotations/:path*",
    "/seo-tests/:path*",
    "/team/:path*",
    "/settings/:path*",
  ],
};
