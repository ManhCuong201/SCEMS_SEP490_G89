import api from './api'
import { LoginRequest, LoginResponse, Account } from '../types/api'

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/login', {
      email,
      password
    } as LoginRequest)
    localStorage.setItem('token', data.token)
    // Store user data directly from response
    const userData = {
      id: '', // Not provided by login response
      fullName: data.fullName,
      email: data.email,
      phone: '', // Not provided by login response
      role: data.role,
      status: '', // Not provided by login response
      createdAt: '', // Not provided by login response
      updatedAt: '' // Not provided by login response
    }
    localStorage.setItem('user', JSON.stringify(userData))
    return data
  },

  logout(): void {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  },

  getToken(): string | null {
    return localStorage.getItem('token')
  },

  getUser(): Account | null {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  },

  isAuthenticated(): boolean {
    return !!this.getToken()
  }
}
