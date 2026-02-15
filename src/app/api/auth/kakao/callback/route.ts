import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/auth/kakao/callback
 * Kakao redirects here with ?code=...
 * We exchange the code for an ID token, then use signInWithIdToken.
 */
export async function GET(request: NextRequest) {
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

  // Redirect response를 먼저 만들고, 쿠키를 이 response에 직접 심는다.
  // cookies() + NextResponse.redirect() 조합은 쿠키가 누락될 수 있음.
  const response = NextResponse.redirect(`${origin}/`)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
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

  return response
}
