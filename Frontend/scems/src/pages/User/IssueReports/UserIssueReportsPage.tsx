import React, { useEffect, useState } from 'react';
import {
    IssueReportResponse,
    CreateIssueReportRequest,
    Room,
    IssueReportStatus
} from '../../../types/api';
import { issueReportService } from '../../../services/issueReport.service';
import { roomService } from '../../../services/room.service';
import { equipmentService } from '../../../services/equipmentService';
import {
    Container, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Button, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, MenuItem, Box, Chip
} from '@mui/material';

export const UserIssueReportsPage: React.FC = () => {
    const [reports, setReports] = useState<IssueReportResponse[]>([]);
    const [open, setOpen] = useState(false);

    // Form state
    const [rooms, setRooms] = useState<Room[]>([]);
    const [equipments, setEquipments] = useState<any[]>([]);
    const [roomId, setRoomId] = useState<string>('');
    const [equipmentId, setEquipmentId] = useState<string>('');
    const [description, setDescription] = useState('');

    const fetchReports = async () => {
        try {
            const data = await issueReportService.getIssueReports(1, 100);
            setReports(data.items);
        } catch (error) {
            console.error('Failed to fetch reports', error);
        }
    };

    const fetchDropdowns = async () => {
        try {
            const roomsData = await roomService.getRooms(1, 1000);
            setRooms(roomsData.items);
        } catch (error) {
            console.error('Failed to fetch dropdowns', error);
        }
    };

    useEffect(() => {
        const fetchEquip = async () => {
            if (roomId) {
                try {
                    const eqData = await equipmentService.getAll(1, 1000, undefined, undefined, undefined, roomId);
                    setEquipments(eqData.items);
                } catch (err) {
                    setEquipments([]);
                }
            } else {
                setEquipments([]);
                setEquipmentId('');
            }
        };
        fetchEquip();
    }, [roomId]);

    useEffect(() => {
        fetchReports();
        fetchDropdowns();
    }, []);

    const handleCreate = async () => {
        try {
            const request: CreateIssueReportRequest = {
                roomId: roomId || undefined,
                equipmentId: equipmentId || undefined,
                description
            };
            await issueReportService.createIssueReport(request);
            setOpen(false);
            setRoomId('');
            setEquipmentId('');
            setDescription('');
            fetchReports();
        } catch (error) {
            console.error('Failed to create report', error);
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h5">Báo cáo Sự cố của tôi</Typography>
                <Button variant="contained" color="primary" onClick={() => setOpen(true)}>
                    Báo cáo Sự cố
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Ngày</TableCell>
                            <TableCell>Phòng</TableCell>
                            <TableCell>Thiết bị</TableCell>
                            <TableCell>Mô tả</TableCell>
                            <TableCell>Trạng thái</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {reports.map((r) => (
                            <TableRow key={r.id}>
                                <TableCell>{new Date(r.createdAt).toLocaleString()}</TableCell>
                                <TableCell>{r.roomName || '-'}</TableCell>
                                <TableCell>{r.equipmentName || '-'}</TableCell>
                                <TableCell>{r.description}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={
                                            r.status === IssueReportStatus.Open ? 'Mới' :
                                                r.status === IssueReportStatus.InProgress ? 'Đang xử lý' :
                                                    r.status === IssueReportStatus.Resolved ? 'Đã giải quyết' : r.status
                                        }
                                        color={
                                            r.status === IssueReportStatus.Open ? 'error' :
                                                r.status === IssueReportStatus.InProgress ? 'warning' :
                                                    r.status === IssueReportStatus.Resolved ? 'success' : 'default'
                                        }
                                        size="small"
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Báo cáo Sự cố Mới</DialogTitle>
                <DialogContent>
                    <TextField
                        select
                        label="Phòng (Không bắt buộc)"
                        fullWidth
                        margin="normal"
                        value={roomId}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRoomId(e.target.value)}
                    >
                        <MenuItem value=""><em>Không</em></MenuItem>
                        {rooms.map(r => <MenuItem key={r.id} value={r.id}>{r.roomName}</MenuItem>)}
                    </TextField>

                    <TextField
                        select
                        label="Thiết bị (Không bắt buộc)"
                        fullWidth
                        margin="normal"
                        value={equipmentId}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEquipmentId(e.target.value)}
                    >
                        <MenuItem value=""><em>Không</em></MenuItem>
                        {equipments.map(e => <MenuItem key={e.id} value={e.id}>{e.name} ({e.equipmentTypeName})</MenuItem>)}
                    </TextField>

                    <TextField
                        label="Mô tả"
                        fullWidth
                        multiline
                        rows={4}
                        margin="normal"
                        required
                        value={description}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Hủy</Button>
                    <Button onClick={handleCreate} variant="contained" disabled={!description}>Gửi</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};
