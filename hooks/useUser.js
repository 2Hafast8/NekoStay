'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useUser() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchProfile = useCallback(async (authUser) => {
    if (!authUser) {
      setProfile(null)
      return
    }
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()
      setProfile(profileData)
    } catch (err) {
      console.error('Error fetching profile:', err)
    }
  }, [supabase])

  useEffect(() => {
    let isMounted = true

    async function getUser() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!isMounted) return
        setUser(authUser)
        await fetchProfile(authUser)
      } catch (err) {
        console.error('Error getting user:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    getUser()

    // Listen for auth state changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return
      const currentUser = session?.user || null
      setUser(currentUser)
      
      if (event === 'SIGNED_OUT') {
        setProfile(null)
        setLoading(false)
      } else if (currentUser) {
        await fetchProfile(currentUser)
        setLoading(false)
      } else {
        setLoading(false)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [supabase, fetchProfile])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  return { user, profile, loading, signOut }
}
