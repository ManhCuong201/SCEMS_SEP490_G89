import api from './api'
import { Account, CreateAccountRequest, UpdateAccountRequest, PaginatedResponse } from '../types/api'

export const accountService = {
  async getAccounts(pageIndex: number = 1, pageSize: number = 10, search?: string, role?: string): Promise<PaginatedResponse<Account>> {
    const { data } = await api.get<PaginatedResponse<Account>>('/admin/accounts', {
      params: { pageIndex, pageSize, search, role }
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
  },

  async importAccounts(file: File): Promise<{ successCount: number, failureCount: number, errors: string[] }> {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await api.post('/admin/accounts/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return data
  },

  async downloadTemplate(): Promise<void> {
    const { data } = await api.get('/admin/accounts/import/template', {
      responseType: 'blob'
    })
    const url = window.URL.createObjectURL(new Blob([data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'Account_Template.xlsx')
    document.body.appendChild(link)
    link.click()
    link.remove()
  }
}
