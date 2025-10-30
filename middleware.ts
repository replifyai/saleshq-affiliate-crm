import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the path starts with /api
  if (pathname.startsWith('/api')) {
    // API routes are handled by their respective route handlers
    return NextResponse.next();
  }

  // Check if user is trying to access auth pages
  const isAuthPage = pathname.startsWith('/auth');
  
  // Check if user is trying to access protected pages
  const isProtectedPage = pathname.startsWith('/dashboard') || pathname === '/';

  // Get the idToken from cookies
  const idToken = request.cookies.get('idToken')?.value;

  // If accessing a protected page without authentication
  if (isProtectedPage && !idToken) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // If accessing auth pages while already authenticated
  if (isAuthPage && idToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|file.svg|globe.svg|next.svg|vercel.svg|window.svg).*)'],
};

