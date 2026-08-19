import { useEffect, useState } from 'react'

import {
  getCurrentUser,
  login as loginUser,
  logout as logoutUser,
  refreshCurrentUser,
} from '@/api/authApi'
import AuthContext from '@/context/auth-context'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isActive = true

    async function restoreSession() {
      const currentUser = await getCurrentUser()

      if (isActive) {
        setUser(currentUser)
        setIsLoading(false)
      }
    }

    restoreSession()

    return () => {
      isActive = false
    }
  }, [])

  async function login(loginId, password) {
    const loggedInUser = await loginUser(loginId, password)
    setUser(loggedInUser)
    return loggedInUser
  }

  async function logout() {
    await logoutUser()
    setUser(null)
  }

  async function refreshUser() {
    const refreshedUser = await refreshCurrentUser()
    setUser(refreshedUser)
    return refreshedUser
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
