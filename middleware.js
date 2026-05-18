import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse } from 'next/server'

export async function middleware(request) {
  const { supabase, user, response } = await updateSession(request)

  const { pathname } = request.nextUrl
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/forgot-password')
  const isAdminPage = pathname.startsWith('/admin')
  const isProtectedPage = pathname.startsWith('/dashboard') ||
                          pathname.startsWith('/booking') ||
                          pathname.startsWith('/profile') ||
                          pathname.startsWith('/notifications')

  // Redirect ke login jika belum login
  if (!user && (isProtectedPage || isAdminPage)) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect ke dashboard jika sudah login tapi akses auth page
  if (user && isAuthPage) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const redirectTo = profile?.role === 'admin' ? '/admin/dashboard' : '/dashboard'
    return NextResponse.redirect(new URL(redirectTo, request.url))
  }

  // Cek role admin
  if (isAdminPage && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
