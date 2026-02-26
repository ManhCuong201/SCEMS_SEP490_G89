import api from './api';
import {
    IssueReportResponse,
    CreateIssueReportRequest,
    UpdateIssueReportStatusRequest,
    PaginatedResponse,
    IssueReportStatus
} from '../types/api';

class IssueReportService {
    async getIssueReports(pageIndex = 1, pageSize = 10, search?: string, status?: IssueReportStatus): Promise<PaginatedResponse<IssueReportResponse>> {
        const params = new URLSearchParams({
            pageIndex: pageIndex.toString(),
            pageSize: pageSize.toString()
        });

        if (search) params.append('search', search);
        if (status) params.append('status', status);

        const response = await api.get(`/IssueReports?${params}`);
        return response.data;
    }

    async getIssueReportById(id: string): Promise<IssueReportResponse> {
        const response = await api.get(`/IssueReports/${id}`);
        return response.data;
    }

    async createIssueReport(request: CreateIssueReportRequest): Promise<IssueReportResponse> {
        const response = await api.post('/IssueReports', request);
        return response.data;
    }

    async updateIssueReportStatus(id: string, request: UpdateIssueReportStatusRequest): Promise<IssueReportResponse> {
        const response = await api.patch(`/IssueReports/${id}/status`, request);
        return response.data;
    }
}

export const issueReportService = new IssueReportService();
