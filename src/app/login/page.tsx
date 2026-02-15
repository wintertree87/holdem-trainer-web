'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import { isInAppBrowser, openExternalBrowser, loginWithKakao, loginWithGoogle } from '@/lib/auth-helpers'

export default function LoginPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [inApp, setInApp] = useState(false)
  const [loading, setLoading] = useState<'kakao' | 'google' | null>(null)

  useEffect(() => {
    setInApp(isInAppBrowser())
  }, [])

  // getSession()으로 로컬 체크 — 서버 왕복 없이 즉시 판단
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/')
      } else {
        setChecking(false)
      }
    })
  }, [router])

  const handleKakao = () => {
    setLoading('kakao')
    loginWithKakao()
  }

  const handleGoogle = () => {
    setLoading('google')
    loginWithGoogle()
  }

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500 text-sm">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="text-center max-w-sm w-full">
        {/* Hero */}
        <div className="mb-10">
          <div className="text-7xl mb-5 animate-emoji-bounce">🃏</div>
          <h1 className="text-3xl font-black text-white mb-3 tracking-tight">
            홀덤 트레이너
          </h1>
          <p className="text-gray-400 text-[15px] leading-relaxed">
            매일 조금씩 연습하면<br />
            어느새 테이블 위 중수가 됩니다
          </p>
        </div>

        {/* Features */}
        <div className="flex justify-center gap-6 mb-10 text-center">
          <div>
            <div className="text-2xl mb-1">🎯</div>
            <div className="text-[11px] text-gray-500">스킬 트리<br/>단계별 학습</div>
          </div>
          <div>
            <div className="text-2xl mb-1">🔥</div>
            <div className="text-[11px] text-gray-500">연습 모드<br/>실전 감각</div>
          </div>
          <div>
            <div className="text-2xl mb-1">📊</div>
            <div className="text-[11px] text-gray-500">진도 추적<br/>약점 분석</div>
          </div>
        </div>

        {/* Login Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleKakao}
            disabled={loading !== null}
            className="w-full py-3.5 px-6 bg-[#FEE500] text-[#191919] rounded-xl font-semibold text-base flex items-center justify-center gap-3 cursor-pointer hover:bg-[#FDD800] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {loading === 'kakao' ? (
              <span className="inline-block w-5 h-5 border-2 border-[#191919]/30 border-t-[#191919] rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#191919" d="M12 3C6.48 3 2 6.36 2 10.44c0 2.62 1.75 4.93 4.38 6.24l-1.12 4.16c-.1.36.31.65.63.44l4.94-3.26c.38.04.77.06 1.17.06 5.52 0 10-3.36 10-7.5S17.52 3 12 3z"/>
              </svg>
            )}
            {loading === 'kakao' ? '연결 중...' : '카카오로 시작하기'}
          </button>

          {inApp ? (
            <>
              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-gray-700" />
                <span className="text-xs text-gray-500">또는</span>
                <div className="flex-1 h-px bg-gray-700" />
              </div>
              <button
                onClick={() => openExternalBrowser('/login')}
                className="w-full py-3 px-6 bg-gray-700 text-gray-200 rounded-xl font-medium text-sm flex items-center justify-center gap-2 cursor-pointer hover:bg-gray-600 active:scale-[0.98] transition-all duration-200"
              >
                Google 로그인은 외부 브라우저에서 →
              </button>
            </>
          ) : (
            <button
              onClick={handleGoogle}
              disabled={loading !== null}
              className="w-full py-3.5 px-6 bg-white text-gray-900 rounded-xl font-semibold text-base flex items-center justify-center gap-3 cursor-pointer hover:bg-gray-50 hover:shadow-lg hover:shadow-white/10 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading === 'google' ? (
                <span className="inline-block w-5 h-5 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              {loading === 'google' ? '연결 중...' : 'Google로 시작하기'}
            </button>
          )}
        </div>

        <p className="text-gray-600 text-xs mt-4">
          기기 간 학습 기록 동기화를 위해 로그인이 필요합니다
        </p>

        <a
          href="/onboarding"
          className="inline-block text-indigo-400 text-sm mt-3 hover:text-indigo-300 transition-colors"
        >
          먼저 체험해보기 →
        </a>
      </div>
    </div>
  )
}
