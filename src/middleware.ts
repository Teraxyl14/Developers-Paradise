import NextAuth from "next-auth"
import { authConfig } from "./auth.config"

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;
  const isPublicRoute = pathname === '/' || pathname === '/dashboard' || pathname.startsWith('/api/auth') || pathname.startsWith('/idea');

  if (!isPublicRoute && !isLoggedIn) {
    const signInUrl = new URL('/api/auth/signin', req.nextUrl);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return Response.redirect(signInUrl);
  }
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
