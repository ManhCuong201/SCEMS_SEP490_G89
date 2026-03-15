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
      setLoading(true);
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
                         (filter === 'Occupied' && r.isOccupied) ||
                         (filter === 'Available' && !r.isOccupied);
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (isOccupied: boolean) => {
    return isOccupied ? '#f59e0b' : '#10b981';
  };

  const getStatusLabel = (isOccupied: boolean) => {
    return isOccupied ? 'Đang sử dụng' : 'Trống';
  };

  const getStatusIcon = (isOccupied: boolean) => {
    return isOccupied ? <Clock size={14} /> : <CheckCircle2 size={14} />;
  };
  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 m-0">Giám sát Phòng thời gian thực</h1>
            <p className="text-gray-500 text-sm mt-1">Theo dõi tình trạng sử dụng phòng học và phòng chức năng hiện tại</p>
          </div>
        </div>
        <button 
          className="btn btn-outline" 
          onClick={fetchStatus}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          Làm mới
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 300px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input 
            type="text" 
            className="form-input" 
            placeholder="Tìm theo tên hoặc mã phòng..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.75rem', width: '100%', height: '42px' }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', background: '#f1f5f9', padding: '4px', borderRadius: '12px' }}>
          {(['all', 'Available', 'Occupied'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: 'none',
                background: filter === f ? 'white' : 'transparent',
                color: filter === f ? '#0f172a' : '#64748b',
                fontWeight: filter === f ? 600 : 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: filter === f ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              {f === 'all' ? 'Tất cả' : f === 'Available' ? 'Đang trống' : 'Đang sử dụng'}
            </button>
          ))}
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {loading && rooms.length === 0 ? <Loading fullPage={false} /> : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
          gap: '1.5rem' 
        }}>
          {filteredRooms.map(room => (
            <div key={room.roomId} className="glass-panel hover-scale" style={{ 
              padding: '1.5rem', 
              borderLeft: `5px solid ${getStatusColor(room.isOccupied)}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Top Section */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#1e293b' }}>{room.roomName}</h3>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>{room.roomCode}</span>
                </div>
                <div style={{ 
                  padding: '4px 10px', 
                  borderRadius: '20px', 
                  fontSize: '0.75rem', 
                  fontWeight: 700,
                  backgroundColor: `${getStatusColor(room.isOccupied)}15`,
                  color: getStatusColor(room.isOccupied),
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  border: `1px solid ${getStatusColor(room.isOccupied)}30`
                }}>
                  {getStatusIcon(room.isOccupied)}
                  {getStatusLabel(room.isOccupied)}
                </div>
              </div>

              {/* Current Activity Box */}
              <div style={{ 
                background: room.currentActivity ? '#f8fafc' : '#fcfcfd', 
                borderRadius: '10px', 
                padding: '1.25rem',
                fontSize: '0.875rem',
                border: '1px solid #f1f5f9'
              }}>
                {room.currentActivity ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ fontWeight: 600, color: '#0f172a', lineHeight: '1.4' }}>{room.currentActivity}</div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontSize: '0.8rem' }}>
                        <Users size={14} style={{ opacity: 0.7 }} />
                        <span style={{ fontWeight: 500 }}>{room.occupiedBy || 'Không xác định'}</span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontSize: '0.8rem' }}>
                        <Clock size={14} style={{ opacity: 0.7 }} />
                        <span style={{ fontWeight: 500 }}>
                          {room.nextActivityStartTime ? 
                            new Date(room.nextActivityStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 
                            '-'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ color: '#94a3b8', fontSize: '0.875rem', textAlign: 'center', padding: '0.5rem 0' }}>
                    Hiện không có hoạt động nào
                  </div>
                )}
              </div>

              {/* Next Activity Footer (if any) */}
              {room.hasNextActivity && room.nextActivityStartTime && (
                <div style={{ 
                  marginTop: 'auto',
                  borderTop: '1px solid #f1f5f9',
                  paddingTop: '1rem',
                  fontSize: '0.8rem', 
                  color: '#64748b', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  fontWeight: 500
                }}>
                  <AlertCircle size={14} style={{ color: '#f59e0b' }} />
                  <span>Sắp tới: <strong style={{ color: '#1e293b' }}>{new Date(room.nextActivityStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && filteredRooms.length === 0 && (
        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '50%', marginBottom: '1.5rem' }}>
            <Search size={40} style={{ color: '#cbd5e1' }} />
          </div>
          <p style={{ fontSize: '1.1rem', color: '#64748b', fontWeight: 500 }}>Không tìm thấy phòng nào phù hợp</p>
        </div>
      )}
    </div>
  );
};
