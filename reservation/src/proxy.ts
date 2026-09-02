import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Rafraîchit la session Supabase sur chaque requête et protège /admin :
// pas de session -> redirigé vers /admin (écran de connexion) ; déjà
// connectée et sur /admin -> redirigée vers /admin/aujourdhui.
// Ne protège que le chargement des pages : les Server Actions admin
// revérifient l'auth elles-mêmes via RLS (voir doc Next.js "proxy" —
// une Server Action n'est pas une route distincte pour le matcher).
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (pathname === "/admin" && user) {
    return NextResponse.redirect(new URL("/admin/aujourdhui", request.url));
  }

  if (pathname.startsWith("/admin/") && !user) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
