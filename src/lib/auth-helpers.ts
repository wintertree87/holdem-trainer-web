import { createClient } from '@/lib/supabase-browser'

/** 인앱 브라우저 감지 (카카오톡, 인스타그램, 네이버 등) */
export function isInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || navigator.vendor || ''
  return /KAKAOTALK|Instagram|FBAN|FBAV|NAVER|Line|Twitter|Snapchat|Daum/i.test(ua)
}

/** 인앱 → 외부 브라우저로 열기 */
export function openExternalBrowser(targetPath = '/login'): void {
  const url = window.location.origin + targetPath
  const ua = navigator.userAgent || ''
  if (/KAKAOTALK/i.test(ua)) {
    window.location.href = 'kakaotalk://web/openExternal?url=' + encodeURIComponent(url)
    return
  }
  if (/Android/i.test(ua)) {
    window.location.href = `intent://${url.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end`
    return
  }
  window.location.href = url
}

/** 카카오 커스텀 OIDC — 클라이언트에서 직접 카카오로 리다이렉트 (서버 경유 없음) */
export function loginWithKakao(): void {
  const clientId = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID
  if (!clientId) {
    throw new Error('NEXT_PUBLIC_KAKAO_CLIENT_ID not configured')
  }
  const redirectUri = `${window.location.origin}/api/auth/kakao/callback`
  const scope = 'profile_nickname profile_image openid'

  const url = new URL('https://kauth.kakao.com/oauth/authorize')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', scope)

  window.location.href = url.toString()
}

/** Google OAuth via Supabase */
export async function loginWithGoogle(): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })
  if (error) {
    throw error
  }
}
