import api from './api'
import { Account, CreateAccountRequest, UpdateAccountRequest, PaginatedResponse } from '../types/api'

export const accountService = {
  async getAccounts(pageIndex: number = 1, pageSize: number = 10, search?: string): Promise<PaginatedResponse<Account>> {
    const { data } = await api.get<PaginatedResponse<Account>>('/admin/accounts', {
      params: { pageIndex, pageSize, search }
    })
    return data
  },

  async getAccountById(id: string): Promise<Account> {
    const { data } = await api.get<Account>(`/admin/accounts/${id}`)
    return data
  },

  async createAccount(account: CreateAccountRequest): Promise<Account> {
    const { data } = await api.post<Account>('/admin/accounts', account)
    return data
  },

  async updateAccount(id: string, account: UpdateAccountRequest): Promise<Account> {
    const { data } = await api.put<Account>(`/admin/accounts/${id}`, account)
    return data
  },

  async deleteAccount(id: string): Promise<void> {
    await api.delete(`/admin/accounts/${id}`)
  },

  async updateStatus(id: string, status: number): Promise<void> {
    await api.patch(`/admin/accounts/${id}/status`, { status })
  }
}
