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

    // 페이지 로드 시 UTM 캡처
    captureUtm()

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)

        // 가입/로그인 시 UTM 저장 (중복 방지)
        if (event === 'SIGNED_IN' && session?.user && !utmSavedRef.current) {
          utmSavedRef.current = true
          const utm = getUtm()
          if (utm) {
            await supabase.from('utm_tracking').insert({
              user_id: session.user.id,
              ...utm,
            })
            clearUtm()
          }
        }
      }
    )

    return () => subscription.unsubscribe()
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
