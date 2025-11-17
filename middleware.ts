export { default } from "next-auth/middleware";

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
