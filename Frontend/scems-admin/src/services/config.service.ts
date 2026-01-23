import api from './api'

export interface BookingSettings {
  startHour: number
  endHour: number
  slotDurationMinutes: number
}

export const configService = {
  async getBookingSettings(): Promise<BookingSettings> {
    const { data } = await api.get<BookingSettings>('/config/booking')
    return data
  }
}
