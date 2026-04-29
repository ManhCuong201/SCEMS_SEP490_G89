import api from './api'

export interface SystemConfiguration {
  id: string
  key: string
  value: string
  description: string
}



export interface UpdateSettingRequest {
  value: string
  description?: string
}

export const configService = {
  async getAllSettings(): Promise<SystemConfiguration[]> {
    const { data } = await api.get<SystemConfiguration[]>('/configuration')
    return data
  },

  async getSetting(key: string): Promise<SystemConfiguration> {
    const { data } = await api.get<SystemConfiguration>(`/configuration/${key}`)
    return data
  },

  async updateSetting(key: string, request: UpdateSettingRequest): Promise<{ message: string }> {
    const { data } = await api.put<{ message: string }>(`/configuration/${key}`, request)
    return data
  },


}
