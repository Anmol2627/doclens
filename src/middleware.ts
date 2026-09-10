import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Update the supabase session and get the response object
  let response = await updateSession(request)

  const { pathname } = request.nextUrl
  
  // Exclude auth routes, static assets, images, etc.
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') || // Assuming APIs might handle their own auth or are public for now
    pathname.startsWith('/login') ||
    pathname.startsWith('/auth') ||
    pathname.includes('.') || // matches static files like favicon.ico, images, etc.
    pathname === '/manifest.webmanifest'
  ) {
    return response
  }

  // Check auth session
  // Since updateSession doesn't easily return the user directly to this scope, 
  // we can create a quick client to check the session
  const { createServerClient } = require('@supabase/ssr')
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: any[]) {
          // ignore, we're just reading
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // If no session, redirect to login
  if (!session) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}