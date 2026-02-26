import React, { useEffect, useState } from 'react';
import {
    IssueReportResponse,
    IssueReportStatus,
    UpdateIssueReportStatusRequest
} from '../../../types/api';
import { issueReportService } from '../../../services/issueReport.service';
import {
    Container, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip, MenuItem, Select,
    FormControl, Box, TextField
} from '@mui/material';

export const AdminIssueReportsPage: React.FC = () => {
    const [reports, setReports] = useState<IssueReportResponse[]>([]);
    const [statusFilter, setStatusFilter] = useState<IssueReportStatus | ''>('');
    const [searchQuery, setSearchQuery] = useState('');

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'Open': return 'Mở';
            case 'InProgress': return 'Đang xử lý';
            case 'Resolved': return 'Đã giải quyết';
            case 'Closed': return 'Đã đóng';
            default: return status;
        }
    };

    const fetchReports = async () => {
        try {
            const data = await issueReportService.getIssueReports(
                1,
                100,
                searchQuery || undefined,
                statusFilter || undefined
            );
            setReports(data.items);
        } catch (error) {
            console.error('Failed to fetch reports', error);
        }
    };

    useEffect(() => {
        fetchReports();
    }, [statusFilter, searchQuery]);

    const handleStatusChange = async (id: string, newStatus: IssueReportStatus) => {
        try {
            const request: UpdateIssueReportStatusRequest = { status: newStatus };
            await issueReportService.updateIssueReportStatus(id, request);
            fetchReports();
        } catch (error) {
            console.error('Failed to update status', error);
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h5">Quản lý báo cáo sự cố</Typography>
            </Box>

            <Box display="flex" gap={2} mb={3}>
                <TextField
                    label="Tìm kiếm phòng, thiết bị, mô tả"
                    variant="outlined"
                    size="small"
                    value={searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                    sx={{ width: 300 }}
                />

                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <Select
                        displayEmpty
                        value={statusFilter}
                        onChange={(e: any) => setStatusFilter(e.target.value as IssueReportStatus | '')}
                    >
                        <MenuItem value=""><em>Tất cả trạng thái</em></MenuItem>
                        {Object.values(IssueReportStatus).map(status => (
                            <MenuItem key={status} value={status}>{getStatusLabel(status)}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Ngày báo cáo</TableCell>
                            <TableCell>Người báo cáo</TableCell>
                            <TableCell>Phòng</TableCell>
                            <TableCell>Thiết bị</TableCell>
                            <TableCell width="30%">Mô tả</TableCell>
                            <TableCell>Trạng thái / Hành động</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {reports.map((r) => (
                            <TableRow key={r.id}>
                                <TableCell>{new Date(r.createdAt).toLocaleString()}</TableCell>
                                <TableCell>{r.createdByName}</TableCell>
                                <TableCell>{r.roomName || '-'}</TableCell>
                                <TableCell>{r.equipmentName || '-'}</TableCell>
                                <TableCell>{r.description}</TableCell>
                                <TableCell>
                                    <FormControl size="small" fullWidth>
                                        <Select
                                            value={r.status}
                                            onChange={(e: any) => handleStatusChange(r.id, e.target.value as IssueReportStatus)}
                                            sx={{
                                                bgcolor: r.status === IssueReportStatus.Open ? '#ffeeb' :
                                                    r.status === IssueReportStatus.InProgress ? '#fff8e1' :
                                                        r.status === IssueReportStatus.Resolved ? '#e8f5e9' : 'transparent'
                                            }}
                                        >
                                            <MenuItem value={IssueReportStatus.Open}>Mở</MenuItem>
                                            <MenuItem value={IssueReportStatus.InProgress}>Đang xử lý</MenuItem>
                                            <MenuItem value={IssueReportStatus.Resolved}>Đã giải quyết</MenuItem>
                                            <MenuItem value={IssueReportStatus.Closed}>Đã đóng</MenuItem>
                                        </Select>
                                    </FormControl>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Container>
    );
};
