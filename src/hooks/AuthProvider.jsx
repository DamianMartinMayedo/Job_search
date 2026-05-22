import { AuthContext, useAuthState } from './useAuthState'

export function AuthProvider({ children }) {
  const auth = useAuthState()
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  )
}
