import api from './api';

export interface ClassResponse {
    id: string;
    classCode: string;
    subjectName: string;
    lecturerId: string;
}

export interface EnrolledStudent {
    id: string; // Account Id if registered, otherwise dummy string for DataTable
    fullName: string;
    email: string;
    studentCode?: string;
    status: string;
}

const classService = {
    getTeacherClasses: async (): Promise<ClassResponse[]> => {
        const response = await api.get('/classes/teacher');
        return response.data;
    },

    getClassStudents: async (classId: string): Promise<EnrolledStudent[]> => {
        const response = await api.get(`/classes/${classId}/students`);
        return response.data;
    },

    async downloadTemplate() {
        const response = await api.get('/classes/download-template', {
            responseType: 'blob'
        })
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', 'Student_Import_Template.xlsx')
        document.body.appendChild(link)
        link.click()
        link.remove()
    },

    importStudents: async (classId: string, file: File): Promise<any> => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post(`/classes/${classId}/import-students`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    }
};

export default classService;
