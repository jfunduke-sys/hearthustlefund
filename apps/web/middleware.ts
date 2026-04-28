import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Never touch Next internals or API routes — avoids failed Supabase/env work breaking CSS/JS.
  if (
    path.startsWith("/_next") ||
    path.startsWith("/api") ||
    path === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options?: Partial<{
              httpOnly: boolean;
              secure: boolean;
              sameSite: "lax" | "strict" | "none";
              maxAge: number;
              path: string;
              domain: string;
            }>;
          }[]
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const adminLogin = path.startsWith("/admin/login");
  const coachPublic =
    path.startsWith("/coach/login") ||
    path.startsWith("/coach/register") ||
    path.startsWith("/coach/app-bridge") ||
    path.startsWith("/coach/forgot-password") ||
    path.startsWith("/coach/reset-password");

  if (path.startsWith("/coach") && !coachPublic) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/coach/login";
      url.searchParams.set("next", path);
      return NextResponse.redirect(url);
    }
  }

  if (path.startsWith("/admin") && !adminLogin) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
    const expected = process.env.SUPERADMIN_EMAIL?.toLowerCase().trim();
    if (!expected || user.email?.toLowerCase().trim() !== expected) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Skip all Next internals, API routes, and static files so CSS/JS chunks always bypass middleware.
    "/((?!api|_next|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
