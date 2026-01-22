import api from './api'
import { LoginRequest, LoginResponse, Account } from '../types/api'

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/login', {
      email,
      password
    } as LoginRequest)
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
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
