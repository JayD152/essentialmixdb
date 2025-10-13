import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const path = req.nextUrl.pathname;
    if (path.startsWith('/admin')) {
      const isAdmin = (req as any).nextauth?.token?.adm;
      if (!isAdmin) {
        const url = new URL('/auth', req.url);
        url.searchParams.set('unauthorized', '1');
        return NextResponse.redirect(url);
      }
    }
  },
  {
    callbacks: {
      // Basic auth check; fine-grained admin check above.
      authorized: ({ token }) => !!token
    }
  }
);

export const config = {
  matcher: ['/library/:path*','/account','/admin/:path*']
};
