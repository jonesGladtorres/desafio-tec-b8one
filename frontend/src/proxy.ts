import { NextRequest, NextResponse } from 'next/server';

const PROTECTED = ['/appointments', '/profile', '/exams'];
const AUTH_ONLY = ['/login', '/register'];
const TOKEN_COOKIE = 'exams_portal_token';

export function proxy(request: NextRequest) {
  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED.some((route) => pathname.startsWith(route));
  const isAuthOnly = AUTH_ONLY.some((route) => pathname.startsWith(route));

  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuthOnly && token) {
    return NextResponse.redirect(new URL('/exams', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
