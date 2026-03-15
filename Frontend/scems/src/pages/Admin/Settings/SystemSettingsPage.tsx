import React, { useState, useEffect } from 'react';
import { Settings, Save, Shield, Calendar, Bell, Monitor, Wrench, Info, RefreshCw } from 'lucide-react';
import { configService, SystemConfiguration } from '../../../services/config.service';
import toast from 'react-hot-toast';

const SystemSettingsPage: React.FC = () => {
    const [settings, setSettings] = useState<SystemConfiguration[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'booking' | 'classroom' | 'equipment' | 'notification' | 'security'>('booking');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const data = await configService.getAllSettings();
            setSettings(data);
        } catch (error) {
            toast.error('Không thể tải cài đặt hệ thống');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (key: string, value: string) => {
        try {
            setSaving(key);
            await configService.updateSetting(key, { value });
            toast.success(`Đã cập nhật: ${key}`);
            setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));
        } catch (error) {
            toast.error('Cập nhật thất bại');
        } finally {
            setSaving(null);
        }
    };

    const filterSettings = (prefix: string) => {
        return settings.filter(s => s.key.startsWith(prefix));
    };

    const renderSettingRow = (s: SystemConfiguration) => (
        <div key={s.key} style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '1.25rem', 
            borderBottom: '1px solid var(--border-color)',
            transition: 'background-color 0.2s ease'
        }}>
            <div style={{ flex: '1', marginRight: '1.5rem' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>{s.key}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{s.description}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: '280px' }}>
                <input
                    type="text"
                    defaultValue={s.value}
                    onBlur={(e) => {
                        if (e.target.value !== s.value) {
                            handleUpdate(s.key, e.target.value);
                        }
                    }}
                    className="form-input"
                    disabled={saving === s.key}
                />
                <div style={{ width: '24px', display: 'flex', justifyContent: 'center' }}>
                    {saving === s.key && <RefreshCw size={18} className="spinner" style={{ color: 'var(--color-primary)' }} />}
                </div>
            </div>
        </div>
    );

    const tabs = [
        { id: 'booking', label: 'Quy tắc mượn phòng', icon: Calendar, prefix: 'Booking.' },
        { id: 'classroom', label: 'Phòng học', icon: Monitor, prefix: 'Classroom.' },
        { id: 'equipment', label: 'Thiết bị', icon: Wrench, prefix: 'Equipment.' },
        { id: 'notification', label: 'Thông báo', icon: Bell, prefix: 'Notification.' },
        { id: 'security', label: 'Bảo mật', icon: Shield, prefix: 'Security.' },
    ];

    return (
        <div className="page-container">
            <div className="page-header" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.75rem', backgroundColor: 'var(--primary-50)', color: 'var(--color-primary)', borderRadius: 'var(--radius-md)' }}>
                        <Settings size={28} />
                    </div>
                    <div>
                        <h1 style={{ margin: 0 }}>Cài đặt hệ thống</h1>
                        <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            Quản lý các thông số vận hành và quy tắc nghiệp vụ toàn hệ thống
                        </p>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="loading-container">
                    <RefreshCw className="spinner" size={32} style={{ color: 'var(--color-primary)' }} />
                </div>
            ) : (
                <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ 
                        display: 'flex', 
                        borderBottom: '1px solid var(--border-color)', 
                        overflowX: 'auto',
                        backgroundColor: 'var(--bg-secondary)'
                    }}>
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '1rem 1.5rem',
                                    fontSize: '0.9rem',
                                    fontWeight: activeTab === tab.id ? 600 : 500,
                                    color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--text-muted)',
                                    backgroundColor: activeTab === tab.id ? 'var(--bg-primary)' : 'transparent',
                                    border: 'none',
                                    borderBottom: `2px solid ${activeTab === tab.id ? 'var(--color-primary)' : 'transparent'}`,
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    transition: 'all 0.2s ease',
                                    outline: 'none'
                                }}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div style={{ backgroundColor: 'var(--bg-primary)' }}>
                        <div style={{ 
                            backgroundColor: 'var(--primary-50)', 
                            padding: '1rem 1.5rem', 
                            borderBottom: '1px solid var(--border-color)', 
                            display: 'flex', 
                            alignItems: 'flex-start', 
                            gap: '0.75rem' 
                        }}>
                            <Info size={20} style={{ color: 'var(--color-primary)', marginTop: '2px', flexShrink: 0 }} />
                            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--primary-700)', lineHeight: 1.5 }}>
                                <strong>Lưu ý:</strong> Các thay đổi sẽ có hiệu lực ngay lập tức. Hãy cẩn trọng khi sửa đổi các thông số lõi như thời gian hoạt động hoặc chính sách bảo mật. 
                                Một số thay đổi có thể yêu cầu người dùng đăng nhập lại hoặc làm mới trang để áp dụng đầy đủ.
                            </p>
                        </div>
                        
                        <div>
                            {tabs.map(tab => (
                                <div key={tab.id} style={{ display: activeTab === tab.id ? 'block' : 'none' }}>
                                    {filterSettings(tab.prefix).length > 0 ? (
                                        filterSettings(tab.prefix).map(renderSettingRow)
                                    ) : (
                                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                                            Không có cấu hình nào cho danh mục này.
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SystemSettingsPage;
