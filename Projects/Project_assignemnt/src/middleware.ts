import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // Create a response object to manipulate
  const res = NextResponse.next()

  // Only perform auth checks if we have valid Supabase credentials
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
      process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
    // In development/testing mode without real Supabase credentials, just pass through
    return res
  }

  try {
    // Create authenticated Supabase Client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              res.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    // Check if we have a session
    const {
      data: { session },
      error
    } = await supabase.auth.getSession()

    if (error) {
      console.warn('Auth session error in middleware:', error.message)
      // Clear potentially corrupted auth cookies
      res.cookies.delete('sb-access-token')
      res.cookies.delete('sb-refresh-token')
    }

    // Define public routes that don't require authentication
    const publicRoutes = ['/', '/auth', '/landing']
    const isPublicRoute = publicRoutes.includes(req.nextUrl.pathname)

    // Define protected routes that require authentication
    const protectedRoutes = ['/dashboard', '/profile', '/classes', '/assignments']
    const isProtectedRoute = protectedRoutes.some(route => 
      req.nextUrl.pathname.startsWith(route)
    )

    // If user is not signed in and trying to access protected route, redirect to auth
    if (!session && isProtectedRoute) {
      const redirectUrl = new URL('/auth', req.url)
      redirectUrl.searchParams.set('redirect', req.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // If user is not signed in and the current path is not public, redirect to auth
    if (!session && !isPublicRoute && !req.nextUrl.pathname.startsWith('/_next') && !req.nextUrl.pathname.startsWith('/api')) {
      const redirectUrl = new URL('/auth', req.url)
      redirectUrl.searchParams.set('redirect', req.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // If user is signed in and trying to access auth or landing page, redirect to dashboard
    if (session && (req.nextUrl.pathname === '/auth' || req.nextUrl.pathname === '/landing')) {
      const redirectParam = req.nextUrl.searchParams.get('redirect')
      const redirectTo = redirectParam && redirectParam.startsWith('/') ? redirectParam : '/dashboard'
      return NextResponse.redirect(new URL(redirectTo, req.url))
    }

    return res
  } catch (error) {
    console.error('Middleware error:', error)
    // On error, allow the request to continue but log the issue
    return res
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}