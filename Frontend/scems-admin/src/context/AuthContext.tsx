import React, { createContext, useContext, useState, ReactNode } from 'react'
import { Account } from '../types/api'
import { authService } from '../services/auth.service'

interface AuthContextType {
  isAuthenticated: boolean
  user: Account | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated())
  const [user, setUser] = useState<Account | null>(authService.getUser())

  const login = async (email: string, password: string) => {
    const response = await authService.login(email, password)
    setIsAuthenticated(true)
    setUser(response.user)
  }

  const logout = () => {
    authService.logout()
    setIsAuthenticated(false)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
