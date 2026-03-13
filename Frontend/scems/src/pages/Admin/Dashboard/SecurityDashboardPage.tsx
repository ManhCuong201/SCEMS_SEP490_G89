import React, { useEffect, useState } from 'react';
import {
    PendingRoomCheck,
    CompleteRoomCheckRequest,
    Booking,
    BookingStatus
} from '../../../types/api';
import { roomCheckService } from '../../../services/roomCheck.service';
import { bookingService } from '../../../services/booking.service';
import {
    Container, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Button, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, Box, Tabs, Tab,
    IconButton, Tooltip, Chip
} from '@mui/material';
import { 
    RefreshCw, 
    AlertTriangle, 
    CheckCircle2, 
    Clock, 
    LogIn, 
    ShieldAlert 
} from 'lucide-react';
import { ReportIncidentModal } from '../../../components/IssueReports/ReportIncidentModal';
import { Alert } from '../../../components/Common/Alert';

export const SecurityDashboardPage: React.FC = () => {
    const [pendingChecks, setPendingChecks] = useState<PendingRoomCheck[]>([]);
    const [activeBookings, setActiveBookings] = useState<Booking[]>([]);
    const [tabIndex, setTabIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Check Dialog State
    const [checkDialogOpen, setCheckDialogOpen] = useState(false);
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
    const [note, setNote] = useState('');

    // Incident Modal State
    const [incidentModalOpen, setIncidentModalOpen] = useState(false);
    const [incidentContext, setIncidentContext] = useState<{roomId?: string, roomName?: string}>({});

    const getLocalToday = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [checks, dayBookings] = await Promise.all([
                roomCheckService.getPendingChecks(),
                bookingService.getBookingsByDay(getLocalToday())
            ]);
            setPendingChecks(checks);
            // Filter only Approved bookings for today that aren't CheckedIn yet
            setActiveBookings(dayBookings.filter(b => b.status === BookingStatus.Approved));
        } catch (err: any) {
            setError('Không thể tải dữ liệu an ninh');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 60000); // refresh every minute
        return () => clearInterval(interval);
    }, []);

    const handleOpenCheckDialog = (roomId: string) => {
        setSelectedRoomId(roomId);
        setNote('');
        setCheckDialogOpen(true);
    };

    const handleCompleteCheck = async () => {
        if (!selectedRoomId) return;
        try {
            const request: CompleteRoomCheckRequest = {
                roomId: selectedRoomId,
                note: note || undefined
            };
            await roomCheckService.completeCheck(request);
            setCheckDialogOpen(false);
            setSuccess('Đã hoàn tất kiểm tra phòng');
            fetchData();
        } catch (err: any) {
            setError('Lỗi khi hoàn tất kiểm tra');
        }
    };

    const handleCheckIn = async (bookingId: string) => {
        try {
            await bookingService.updateStatus(bookingId, BookingStatus.CheckedIn);
            setSuccess('Đã xác nhận nhận phòng (Check-in)');
            fetchData();
        } catch (err: any) {
            setError('Lỗi khi check-in');
        }
    };

    const handleReportIncident = (roomId?: string, roomName?: string) => {
        setIncidentContext({ roomId, roomName });
        setIncidentModalOpen(true);
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <div>
                    <Typography variant="h4" fontWeight={900}>Bảng điều khiển An ninh</Typography>
                    <Typography color="text.secondary">Quản lý kiểm tra phòng và check-in cho khách</Typography>
                </div>
                <Box display="flex" gap={2}>
                    <Button 
                        variant="contained" 
                        color="error" 
                        startIcon={<ShieldAlert />}
                        onClick={() => handleReportIncident()}
                    >
                        Báo cáo Sự cố
                    </Button>
                    <Button 
                        variant="outlined" 
                        startIcon={<RefreshCw className={loading ? 'animate-spin' : ''} />} 
                        onClick={fetchData}
                    >
                        Làm mới
                    </Button>
                </Box>
            </Box>

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}
            {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

            <Paper sx={{ mb: 4 }}>
                <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tab label={`Phòng chờ kiểm tra (${pendingChecks.length})`} />
                    <Tab label={`Lịch đặt cần Check-in (${activeBookings.length})`} />
                </Tabs>

                <Box p={2}>
                    {tabIndex === 0 && (
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Phòng</TableCell>
                                        <TableCell>Hoạt động cuối</TableCell>
                                        <TableCell align="right">Hành động</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {pendingChecks.length === 0 ? (
                                        <TableRow><TableCell colSpan={3} align="center">Mọi phòng đều ổn!</TableCell></TableRow>
                                    ) : (
                                        pendingChecks.map((check) => (
                                            <TableRow key={check.roomId}>
                                                <TableCell>
                                                    <Typography fontWeight={700}>{check.roomName}</Typography>
                                                    <Typography variant="body2" color="text.secondary">{check.roomCode}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Box display="flex" alignItems="center" gap={1}>
                                                        <Clock size={16} color="#64748b" />
                                                        {new Date(check.lastActivityEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </Box>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Box display="flex" justifyContent="flex-end" gap={1}>
                                                        <Button 
                                                            variant="outlined" 
                                                            size="small"
                                                            onClick={() => handleReportIncident(check.roomId, check.roomName)}
                                                        >
                                                            Báo sự cố
                                                        </Button>
                                                        <Button 
                                                            variant="contained" 
                                                            size="small"
                                                            onClick={() => handleOpenCheckDialog(check.roomId)}
                                                        >
                                                            Hoàn tất kiểm tra
                                                        </Button>
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}

                    {tabIndex === 1 && (
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Thời gian</TableCell>
                                        <TableCell>Phòng</TableCell>
                                        <TableCell>Người đặt</TableCell>
                                        <TableCell>Trạng thái</TableCell>
                                        <TableCell align="right">Hành động</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {activeBookings.length === 0 ? (
                                        <TableRow><TableCell colSpan={5} align="center">Không có lịch đặt nào cần check-in hôm nay.</TableCell></TableRow>
                                    ) : (
                                        activeBookings.map((b) => (
                                            <TableRow key={b.id}>
                                                <TableCell>
                                                    <Typography fontWeight={600}>
                                                        {new Date(b.timeSlot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {b.duration}h
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>{b.roomName || 'N/A'}</TableCell>
                                                <TableCell>{b.requestedByName || 'N/A'}</TableCell>
                                                <TableCell>
                                                    <Chip 
                                                        label="Chưa nhận phòng" 
                                                        size="small" 
                                                        color="warning" 
                                                        variant="outlined" 
                                                    />
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Button 
                                                        variant="contained" 
                                                        color="success" 
                                                        size="small"
                                                        startIcon={<LogIn size={16} />}
                                                        onClick={() => handleCheckIn(b.id)}
                                                    >
                                                        Check-in
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Box>
            </Paper>

            {/* Check Completion Dialog */}
            <Dialog open={checkDialogOpen} onClose={() => setCheckDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Xác nhận Kiểm tra Phòng</DialogTitle>
                <DialogContent>
                    <Typography gutterBottom sx={{ mt: 1 }}>
                        Bạn đã kiểm tra an toàn cho phòng học này? Vui lòng ghi lại bất kỳ vấn đề nào (nếu có).
                    </Typography>
                    <TextField
                        label="Ghi chú an ninh"
                        fullWidth
                        multiline
                        rows={3}
                        margin="normal"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Mọi thứ đều ổn / Đèn chưa tắt / ..."
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCheckDialogOpen(false)}>Hủy</Button>
                    <Button onClick={handleCompleteCheck} variant="contained" color="primary">Hoàn tất</Button>
                </DialogActions>
            </Dialog>

            {/* Report Incident Modal */}
            <ReportIncidentModal 
                open={incidentModalOpen}
                onClose={() => setIncidentModalOpen(false)}
                roomId={incidentContext.roomId}
                roomName={incidentContext.roomName}
                onSuccess={() => setSuccess('Đã gửi báo cáo sự cố thành công')}
            />
        </Container>
    );
};
