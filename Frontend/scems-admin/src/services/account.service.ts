import api from './api'
import { Account, CreateAccountRequest, UpdateAccountRequest, PaginatedResponse } from '../types/api'

export const accountService = {
  async getAccounts(pageIndex: number = 1, pageSize: number = 10, search?: string): Promise<PaginatedResponse<Account>> {
    const { data } = await api.get<PaginatedResponse<Account>>('/accounts', {
      params: { pageIndex, pageSize, search }
    })
    return data
  },

  async getAccountById(id: string): Promise<Account> {
    const { data } = await api.get<Account>(`/accounts/${id}`)
    return data
  },

  async createAccount(account: CreateAccountRequest): Promise<Account> {
    const { data } = await api.post<Account>('/accounts', account)
    return data
  },

  async updateAccount(id: string, account: UpdateAccountRequest): Promise<Account> {
    const { data } = await api.put<Account>(`/accounts/${id}`, account)
    return data
  },

  async deleteAccount(id: string): Promise<void> {
    await api.delete(`/accounts/${id}`)
  },

  async updateStatus(id: string, status: number): Promise<void> {
    await api.patch(`/accounts/${id}/status`, { status })
  }
}
