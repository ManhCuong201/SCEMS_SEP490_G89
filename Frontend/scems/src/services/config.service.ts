import api from './api'

export interface SystemConfiguration {
  id: string
  key: string
  value: string
  description: string
}

export interface BookingSettings {
  startHour: number
  endHour: number
  slotDurationMinutes: number
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

  async getBookingSettings(): Promise<BookingSettings> {
    // This is a helper that aggregates settings into a strongly typed object
    const settings = await this.getAllSettings()
    const getVal = (key: string, def: number) => {
      const s = settings.find(x => x.key === key)
      return s ? parseInt(s.value) : def
    }
    return {
      startHour: getVal('START_HOUR', 7),
      endHour: getVal('END_HOUR', 22),
      slotDurationMinutes: getVal('SLOT_DURATION', 60)
    }
  }
}
