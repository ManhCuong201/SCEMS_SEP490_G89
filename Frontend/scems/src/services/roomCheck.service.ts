import api from './api';
import {
    PendingRoomCheck,
    CompleteRoomCheckRequest,
    IssueReportResponse
} from '../types/api';

class RoomCheckService {
    async getPendingChecks(): Promise<PendingRoomCheck[]> {
        const response = await api.get('/RoomChecks/pending');
        return response.data;
    }

    async completeCheck(request: CompleteRoomCheckRequest): Promise<IssueReportResponse> {
        const response = await api.post('/RoomChecks/complete', request);
        return response.data;
    }
}

export const roomCheckService = new RoomCheckService();
