import api from './api'
import { LoginRequest, LoginResponse, Account } from '../types/api'

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/login', {
      email,
      password
    } as LoginRequest)
    authService.setSession(data)
    return data
  },

  async googleLogin(token: string): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/google-login', { token })
    authService.setSession(data)
    return data
  },

  setSession(data: LoginResponse) {
    localStorage.setItem('token', data.token)
    const userData = {
      id: data.id,
      fullName: data.fullName,
      email: data.email,
      phone: '',
      role: data.role,
      status: 'Active',
      createdAt: '',
      updatedAt: ''
    }
    localStorage.setItem('user', JSON.stringify(userData))
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
