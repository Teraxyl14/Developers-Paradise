import NextAuth from "next-auth"
import { authConfig } from "./auth.config"

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Early-exit guardrail: Immediately exit execution for sitemaps, robots, or XML requests
  if (
    pathname.includes('sitemap') ||
    pathname.endsWith('.xml') ||
    pathname === '/robots.txt'
  ) {
    return;
  }

  const isLoggedIn = !!req.auth;
  const isPublicRoute = pathname === '/' || pathname === '/dashboard' || pathname.startsWith('/api/auth') || pathname.startsWith('/idea') || pathname.startsWith('/legal') || pathname.startsWith('/.well-known');

  if (!isPublicRoute && !isLoggedIn) {
    const signInUrl = new URL('/dashboard', req.nextUrl);
    signInUrl.searchParams.set('login', 'true');
    signInUrl.searchParams.set('callbackUrl', pathname);
    return Response.redirect(signInUrl);
  }
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|sitemap/).*)'],
}
