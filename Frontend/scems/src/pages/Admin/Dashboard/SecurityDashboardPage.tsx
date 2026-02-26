import React, { useEffect, useState } from 'react';
import {
    PendingRoomCheck,
    CompleteRoomCheckRequest
} from '../../../types/api';
import { roomCheckService } from '../../../services/roomCheck.service';
import {
    Container, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Button, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, Box
} from '@mui/material';

export const SecurityDashboardPage: React.FC = () => {
    const [pendingChecks, setPendingChecks] = useState<PendingRoomCheck[]>([]);
    const [open, setOpen] = useState(false);
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
    const [note, setNote] = useState('');

    const fetchPendingChecks = async () => {
        try {
            const data = await roomCheckService.getPendingChecks();
            setPendingChecks(data);
        } catch (error) {
            console.error('Failed to fetch pending checks', error);
        }
    };

    useEffect(() => {
        // Fetch initially
        fetchPendingChecks();

        // Auto-refresh every 5 minutes since schedules elapse
        const interval = setInterval(fetchPendingChecks, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const handleOpenDialog = (roomId: string) => {
        setSelectedRoomId(roomId);
        setNote('');
        setOpen(true);
    };

    const handleCompleteCheck = async () => {
        if (!selectedRoomId) return;

        try {
            const request: CompleteRoomCheckRequest = {
                roomId: selectedRoomId,
                note: note || undefined
            };
            await roomCheckService.completeCheck(request);
            setOpen(false);
            fetchPendingChecks();
        } catch (error) {
            console.error('Failed to complete check', error);
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5">Bảng điều khiển An ninh: Các phòng chờ kiểm tra</Typography>
                <Button variant="outlined" onClick={fetchPendingChecks}>Làm mới</Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Phòng</TableCell>
                            <TableCell>Hoạt động kết thúc lúc</TableCell>
                            <TableCell align="right">Hành động</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {pendingChecks.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} align="center">
                                    Không có yêu cầu kiểm tra nào. An toàn!
                                </TableCell>
                            </TableRow>
                        ) : (
                            pendingChecks.map((check) => (
                                <TableRow key={check.roomId}>
                                    <TableCell>
                                        <Typography variant="subtitle1">{check.roomName}</Typography>
                                        <Typography variant="body2" color="text.secondary">{check.roomCode}</Typography>
                                    </TableCell>
                                    <TableCell>{new Date(check.lastActivityEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</TableCell>
                                    <TableCell align="right">
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            onClick={() => handleOpenDialog(check.roomId)}
                                        >
                                            Hoàn tất kiểm tra
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Hoàn tất Kiểm tra An ninh</DialogTitle>
                <DialogContent>
                    <Typography gutterBottom>
                        Đánh dấu phòng này đã được kiểm tra. Nếu mọi thứ ổn, bạn có thể để trống ghi chú.
                        Nếu bạn phát hiện vấn đề (ví dụ: quên tắt đèn, dơ bẩn, ghế hỏng), hãy mô tả bên dưới.
                    </Typography>
                    <TextField
                        label="Ghi chú (Tùy chọn) / Mô tả sự cố"
                        fullWidth
                        multiline
                        rows={3}
                        margin="normal"
                        value={note}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNote(e.target.value)}
                        placeholder="[AN NINH ỔN] Mọi thứ tốt."
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Hủy</Button>
                    <Button onClick={handleCompleteCheck} variant="contained" color="primary">
                        Xác nhận
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};
