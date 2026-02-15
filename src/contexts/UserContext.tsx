'use client'

import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { captureUtm, getUtm, clearUtm } from '@/lib/utm'
import type { User } from '@supabase/supabase-js'

type UserContextType = {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
})

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const utmSavedRef = useRef(false)

  useEffect(() => {
    const supabase = createClient()
    let mounted = true

    // 페이지 로드 시 UTM 캡처
    captureUtm()

    // 세션 먼저 확인 — 세션 없으면 getUser() 호출 자체를 생략 (AuthSessionMissingError 방지)
    void supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return
      if (!session) {
        setUser(null)
        setLoading(false)
        return
      }
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (!mounted) return
        if (error) {
          setUser(null)
        } else {
          setUser(user)
        }
      } catch {
        if (!mounted) return
        setUser(null)
      } finally {
        if (!mounted) return
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return
        setUser(session?.user ?? null)
        setLoading(false)

        // 가입/로그인 시 UTM 저장 (중복 방지)
        if (event === 'SIGNED_IN' && session?.user && !utmSavedRef.current) {
          utmSavedRef.current = true
          const utm = getUtm()
          if (utm) {
            // Supabase auth state callback 내부에서 await 호출 시 교착 상태가 생길 수 있어 비동기로 분리한다.
            setTimeout(() => {
              void (async () => {
                try {
                  const { error } = await supabase
                    .from('utm_tracking')
                    .insert({
                      user_id: session.user.id,
                      ...utm,
                    })

                  if (error) {
                    console.error('Failed to save UTM tracking:', error)
                    return
                  }
                  clearUtm()
                } catch (error) {
                  console.error('Unexpected UTM tracking error:', error)
                }
              })()
            }, 0)
          }
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/onboarding'
  }

  return (
    <UserContext.Provider value={{ user, loading, signOut }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  return useContext(UserContext)
}
