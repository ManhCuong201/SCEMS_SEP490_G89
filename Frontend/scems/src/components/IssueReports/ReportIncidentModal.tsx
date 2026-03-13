import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  MenuItem
} from '@mui/material';
import { AlertTriangle, ShieldOff, HardHat } from 'lucide-react';
import { issueReportService } from '../../services/issueReport.service';
import { CreateIssueReportRequest } from '../../types/api';

interface ReportIncidentModalProps {
  open: boolean;
  onClose: () => void;
  roomId?: string;
  roomName?: string;
  equipmentId?: string;
  equipmentName?: string;
  onSuccess?: () => void;
}

export const ReportIncidentModal: React.FC<ReportIncidentModalProps> = ({
  open,
  onClose,
  roomId,
  roomName,
  equipmentId,
  equipmentName,
  onSuccess
}) => {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [incidentType, setIncidentType] = useState('An ninh');

  const handleSubmit = async () => {
    if (!description.trim()) return;

    setLoading(true);
    try {
      const request: CreateIssueReportRequest = {
        roomId,
        equipmentId,
        description: `[LOẠI: ${incidentType.toUpperCase()}] ${description}`
      };
      await issueReportService.createIssueReport(request);
      setDescription('');
      onClose();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Failed to report incident', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#b91c1c' }}>
        <AlertTriangle /> Báo cáo Sự cố An ninh / Kỹ thuật
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1, mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Bạn đang báo cáo sự cố cho: <strong>{roomName || equipmentName || 'Hệ thống'}</strong>
          </Typography>
        </Box>

        <TextField
          select
          label="Loại sự cố"
          fullWidth
          value={incidentType}
          onChange={(e) => setIncidentType(e.target.value)}
          margin="normal"
        >
          <MenuItem value="An ninh">
            <Box display="flex" alignItems="center" gap={1}>
              <ShieldOff size={16} /> Vi phạm An ninh / Đột nhập
            </Box>
          </MenuItem>
          <MenuItem value="Thiết bị">
            <Box display="flex" alignItems="center" gap={1}>
              <HardHat size={16} /> Hỏng hóc thiết bị / Cháy nổ
            </Box>
          </MenuItem>
          <MenuItem value="Khác">Phát hiện khác</MenuItem>
        </TextField>

        <TextField
          label="Mô tả chi tiết"
          fullWidth
          multiline
          rows={4}
          margin="normal"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Vui lòng mô tả tình hình cụ thể..."
          required
        />
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={loading}>Hủy</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="error" 
          disabled={loading || !description.trim()}
        >
          {loading ? 'Đang gửi...' : 'Gửi báo cáo'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
