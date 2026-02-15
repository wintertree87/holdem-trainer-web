import { NextResponse } from 'next/server'

/**
 * GET /api/auth/kakao
 * Redirects to Kakao OAuth with only the scopes we need (no account_email).
 * This bypasses Supabase GoTrue's default scope which includes account_email.
 */
export async function GET(request: Request) {
  const { origin } = new URL(request.url)
  const clientId = process.env.KAKAO_CLIENT_ID

  if (!clientId) {
    return NextResponse.json({ error: 'KAKAO_CLIENT_ID not configured' }, { status: 500 })
  }

  const redirectUri = `${origin}/api/auth/kakao/callback`
  const scope = 'profile_nickname profile_image openid'

  const kakaoAuthUrl = new URL('https://kauth.kakao.com/oauth/authorize')
  kakaoAuthUrl.searchParams.set('client_id', clientId)
  kakaoAuthUrl.searchParams.set('redirect_uri', redirectUri)
  kakaoAuthUrl.searchParams.set('response_type', 'code')
  kakaoAuthUrl.searchParams.set('scope', scope)

  return NextResponse.redirect(kakaoAuthUrl.toString())
}
