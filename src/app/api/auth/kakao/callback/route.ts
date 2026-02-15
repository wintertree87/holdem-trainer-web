import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

/**
 * GET /api/auth/kakao/callback
 * Kakao redirects here with ?code=...
 * We exchange the code for an ID token, then use signInWithIdToken.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    console.error('Kakao auth error:', error, searchParams.get('error_description'))
    return NextResponse.redirect(`${origin}/login`)
  }

  const clientId = process.env.KAKAO_CLIENT_ID!
  const clientSecret = process.env.KAKAO_CLIENT_SECRET!
  const redirectUri = `${origin}/api/auth/kakao/callback`

  // Exchange authorization code for tokens
  const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      redirect_uri: redirectUri,
      code,
      client_secret: clientSecret,
    }),
  })

  const tokenData = await tokenRes.json()

  if (!tokenData.id_token) {
    console.error('Kakao token exchange failed:', tokenData)
    return NextResponse.redirect(`${origin}/login`)
  }

  // Create Supabase session using the ID token
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { error: signInError } = await supabase.auth.signInWithIdToken({
    provider: 'kakao',
    token: tokenData.id_token,
    access_token: tokenData.access_token,
  })

  if (signInError) {
    console.error('Supabase signInWithIdToken failed:', signInError)
    return NextResponse.redirect(`${origin}/login`)
  }

  return NextResponse.redirect(`${origin}/`)
}
