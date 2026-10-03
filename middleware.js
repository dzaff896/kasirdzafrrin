import { NextResponse } from 'next/server';

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Paths that require authentication
  const isAdminPath = pathname.startsWith('/admin');
  const isKasirPath = pathname.startsWith('/kasir');
  const isLoginPage = pathname === '/login' || pathname === '/';

  const token = request.cookies.get('kasir_session')?.value;

  let sessionUser = null;
  if (token) {
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payloadJson = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
        const payload = JSON.parse(payloadJson);
        if (payload.exp && payload.exp > Math.floor(Date.now() / 1000)) {
          sessionUser = payload;
        }
      }
    } catch (e) {
      sessionUser = null;
    }
  }

  // If on login/root page and already authenticated
  if (isLoginPage) {
    if (sessionUser) {
      if (sessionUser.role === 'Admin') {
        return NextResponse.redirect(new URL('/admin', request.url));
      } else {
        return NextResponse.redirect(new URL('/kasir', request.url));
      }
    }
    // If on root '/', rewrite or redirect to /login
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // Admin route protection
  if (isAdminPath) {
    if (!sessionUser) {
      return NextResponse.redirect(new URL('/login?error=unauthorized', request.url));
    }
    if (sessionUser.role !== 'Admin') {
      // Petugas cannot access admin
      return NextResponse.redirect(new URL('/kasir?error=forbidden', request.url));
    }
    return NextResponse.next();
  }

  // Kasir route protection
  if (isKasirPath) {
    if (!sessionUser) {
      return NextResponse.redirect(new URL('/login?error=unauthorized', request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/admin/:path*', '/kasir/:path*'],
};
