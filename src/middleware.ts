import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import { isAdminRole } from '@/lib/roles'

const ADMIN_ONLY_PREFIXES = ['/admin', '/reports']

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token as { role?: string } | null
    const role = token?.role ?? ''

    // Admins have full access to every route in scope.
    if (isAdminRole(role)) {
      return NextResponse.next()
    }

    const pathname = req.nextUrl.pathname
    const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname

    // Non-admin (EMPLOYEE / DEPT_HEAD) users are restricted to their own
    // dashboard and the request form. Everything else redirects to /dashboard.
    const isBlocked =
      ADMIN_ONLY_PREFIXES.some(
        (p) => normalized === p || normalized.startsWith(p + '/')
      ) || normalized === '/requests'

    if (isBlocked) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
    pages: { signIn: '/login' }
  }
)

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/requests/:path*', '/reports/:path*']
}
