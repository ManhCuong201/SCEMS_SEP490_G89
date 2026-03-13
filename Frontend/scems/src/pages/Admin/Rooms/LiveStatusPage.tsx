import React, { useEffect, useState } from 'react';
import { roomService } from '../../../services/room.service';
import { RoomLiveStatusDto } from '../../../types/api';
import { 
  Building2, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  MapPin,
  Filter,
  Users
} from 'lucide-react';
import { Loading } from '../../../components/Common/Loading';
import { Alert } from '../../../components/Common/Alert';

export const LiveStatusPage: React.FC = () => {
  const [rooms, setRooms] = useState<RoomLiveStatusDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'Occupied' | 'Available'>('all');

  const fetchStatus = async () => {
    try {
      const data = await roomService.getRoomsLiveStatus();
      setRooms(data);
      setError('');
    } catch (err: any) {
      setError('Không thể tải trạng thái thời gian thực');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Auto refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const filteredRooms = rooms.filter(r => {
    const matchesSearch = r.roomName.toLowerCase().includes(search.toLowerCase()) || 
                         r.roomCode.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || 
                         (filter === 'Occupied' && r.currentStatus !== 'Available') ||
                         (filter === 'Available' && r.currentStatus === 'Available');
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return '#10b981'; // Green
      case 'Scheduled': return '#3b82f6'; // Blue
      case 'Booked': return '#f59e0b'; // Amber
      case 'CheckedIn': return '#8b5cf6'; // Purple
      default: return '#64748b';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Available': return 'Trống';
      case 'Scheduled': return 'Có lịch học';
      case 'Booked': return 'Đã đặt chỗ';
      case 'CheckedIn': return 'Đã nhận phòng';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Available': return <CheckCircle2 size={16} />;
      case 'Scheduled': return <Clock size={16} />;
      case 'Booked': return <Clock size={16} />;
      case 'CheckedIn': return <MapPin size={16} />;
      default: return <AlertCircle size={16} />;
    }
  };

  return (
    <div className="container-premium" style={{ padding: '2rem' }}>
      <div className="page-header-simple" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Building2 size={32} className="text-primary" />
            Giám sát Phòng thời gian thực
          </h1>
          <p className="text-muted">Theo dõi tình trạng sử dụng phòng học và phòng chức năng hiện tại</p>
        </div>
        <button 
          className="btn-premium btn-icon" 
          onClick={() => { setLoading(true); fetchStatus(); }}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          Làm mới
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input 
            type="text" 
            className="form-input" 
            placeholder="Tìm theo tên hoặc mã phòng..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '3rem', width: '100%' }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {(['all', 'Available', 'Occupied'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: '1px solid var(--border-glass)',
                background: filter === f ? 'var(--color-primary)' : 'white',
                color: filter === f ? 'white' : 'var(--slate-600)',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {f === 'all' ? 'Tất cả' : f === 'Available' ? 'Đang trống' : 'Đang sử dụng'}
            </button>
          ))}
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {loading ? <Loading fullPage={false} /> : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: '1.5rem' 
        }}>
          {filteredRooms.map(room => (
            <div key={room.id} className="glass-panel hover-scale" style={{ 
              padding: '1.5rem', 
              borderLeft: `4px solid ${getStatusColor(room.currentStatus)}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>{room.roomName}</h3>
                  <span style={{ fontSize: '0.875rem', color: '#64748b' }}>{room.roomCode}</span>
                </div>
                <div style={{ 
                  padding: '0.25rem 0.75rem', 
                  borderRadius: '20px', 
                  fontSize: '0.75rem', 
                  fontWeight: 800,
                  backgroundColor: `${getStatusColor(room.currentStatus)}20`,
                  color: getStatusColor(room.currentStatus),
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  textTransform: 'uppercase'
                }}>
                  {getStatusIcon(room.currentStatus)}
                  {getStatusLabel(room.currentStatus)}
                </div>
              </div>

              <div style={{ 
                background: '#f8fafc', 
                borderRadius: '12px', 
                padding: '1rem',
                fontSize: '0.875rem'
              }}>
                {room.currentActivity ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ fontWeight: 700, color: '#1e293b' }}>{room.currentActivity}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b' }}>
                      <Users size={14} />
                      <span>{room.currentUser || 'Không xác định'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b' }}>
                      <Clock size={14} />
                      <span>Kết thúc: {room.nextActivityStartTime ? new Date(room.nextActivityStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</span>
                    </div>
                  </div>
                ) : (
                  <div style={{ color: '#94a3b8', fontStyle: 'italic', textAlign: 'center' }}>
                    Hiện không có hoạt động nào
                  </div>
                )}
              </div>

              {room.hasNextActivity && room.nextActivityStartTime && (
                <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertCircle size={14} />
                  <span>Sắp tới: {new Date(room.nextActivityStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && filteredRooms.length === 0 && (
        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
          <Search size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
          <p>Không tìm thấy phòng nào phù hợp</p>
        </div>
      )}
    </div>
  );
};
