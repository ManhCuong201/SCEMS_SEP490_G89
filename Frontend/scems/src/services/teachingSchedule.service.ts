import api from './api';
import { ScheduleResponse, ImportScheduleResponse } from '../types/api';

export const scheduleService = {
    async getMySchedule(start: string, end: string, classCode?: string): Promise<ScheduleResponse[]> {
        const { data } = await api.get<ScheduleResponse[]>('/teaching-schedules/my', {
            params: { start, end, classCode }
        });
        return data;
    },

    async getAllSchedules(start: string, end: string): Promise<ScheduleResponse[]> {
        const { data } = await api.get<ScheduleResponse[]>('/teaching-schedules/all', {
            params: { start, end }
        });
        return data;
    },

    async importSchedule(file: File): Promise<ImportScheduleResponse> {
        const formData = new FormData();
        formData.append('file', file);
        const { data } = await api.post<ImportScheduleResponse>('/teaching-schedules/import', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return data;
    },

    async downloadTemplate(): Promise<void> {
        const response = await api.get('/teaching-schedules/template', {
            responseType: 'blob'
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'TeachingSchedule_Template.xlsx');
        document.body.appendChild(link);
        link.click();
        link.remove();
    },

    async getSchedulesByDay(date: string): Promise<ScheduleResponse[]> {
        const { data } = await api.get<ScheduleResponse[]>(`/teaching-schedules/day?date=${date}`);
        return data;
    }
};
