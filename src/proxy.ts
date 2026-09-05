import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  // admin.lotclub.in (and admin.localhost:3000 in dev) serves the /admin
  // route group at its own root, so the admin panel never leaks into the
  // main site's URL space and vice versa. The session refresh below still
  // needs to run for these requests too, so rewrite the URL used for
  // routing but keep going through the same auth-refresh flow.
  const host = request.headers.get("host") ?? "";
  const onAdminSubdomain = host.startsWith("admin.") && !request.nextUrl.pathname.startsWith("/admin");
  const rewrittenUrl = onAdminSubdomain ? request.nextUrl.clone() : null;
  if (rewrittenUrl) rewrittenUrl.pathname = `/admin${request.nextUrl.pathname}`;

  let response = rewrittenUrl
    ? NextResponse.rewrite(rewrittenUrl, { request })
    : NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = rewrittenUrl
            ? NextResponse.rewrite(rewrittenUrl, { request })
            : NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refreshes the auth token if expired — required for Supabase SSR sessions.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)"],
};
