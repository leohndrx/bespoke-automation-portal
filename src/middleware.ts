import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  // Create a response object
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });
  
  // Create the Supabase client with proper Next.js 15 cookie handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          // Only set cookies in the response object
          response.cookies.set(name, value, options);
        },
        remove(name, options) {
          response.cookies.set(name, '', { ...options, maxAge: 0 });
        },
      },
    }
  );
  
  // Refresh the auth token
  // Important: Use the user API instead of relying on getSession for validation
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Handle route protection
    const pathname = request.nextUrl.pathname;
    
    // For public routes that should redirect to dashboard if logged in
    if (pathname === '/login' || pathname === '/register') {
      if (user) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
    
    // For protected routes that require authentication
    if (pathname.startsWith('/dashboard') || 
        pathname.startsWith('/projects') || 
        pathname.startsWith('/tasks') ||
        pathname.startsWith('/clients')) {
      if (!user) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }
  } catch (error) {
    console.error('Auth error in middleware:', error);
    // On auth error for protected routes, redirect to login
    const pathname = request.nextUrl.pathname;
    if (pathname.startsWith('/dashboard') || 
        pathname.startsWith('/projects') || 
        pathname.startsWith('/tasks') ||
        pathname.startsWith('/clients')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}; 