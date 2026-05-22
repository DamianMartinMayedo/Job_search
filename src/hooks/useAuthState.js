import { createContext, useState, useEffect } from 'react'
import { authApi } from '../lib/api'

export const AuthContext = createContext(null)

export function useAuthState() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    authApi
      .me()
      .then((data) => {
        if (!cancelled) {
          setSession({ user: { email: data.email } })
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSession(null)
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const signIn = async (email, password) => {
    setError(null)
    try {
      const data = await authApi.login(email, password)
      setSession({ user: { email: data.email } })
      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }

  const signOut = async () => {
    try {
      await authApi.logout()
    } catch {
      // even if the request fails, clear local state
    }
    setSession(null)
  }

  return {
    session,
    loading,
    error,
    signIn,
    signOut,
  }
}
