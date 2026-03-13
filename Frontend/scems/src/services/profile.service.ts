import api from './api';

export interface ProfileResponse {
    id: string;
    fullName: string;
    email: string;
    studentCode?: string;
    phone?: string;
    role: string;
}

export interface UpdateProfileRequest {
    fullName: string;
    phone?: string;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}

export const profileService = {
    getMyProfile: async (): Promise<ProfileResponse> => {
        const response = await api.get('/profile/me');
        return response.data;
    },

    updateProfile: async (data: UpdateProfileRequest): Promise<ProfileResponse> => {
        const response = await api.put('/profile/me', data);
        return response.data;
    },

    changePassword: async (data: ChangePasswordRequest): Promise<{ message: string }> => {
        const response = await api.put('/profile/me/password', data);
        return response.data;
    }
};

export default profileService;
