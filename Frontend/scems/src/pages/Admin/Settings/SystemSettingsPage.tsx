import React, { useState, useEffect } from 'react';
import { Settings, Save, Shield, Calendar, Bell, Monitor, Wrench, Info, RefreshCw, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { configService, SystemConfiguration } from '../../../services/config.service';
import { roomTypeService } from '../../../services/roomType.service';
import { useAuth } from '../../../context/AuthContext';
import { RoomType } from '../../../types/api';
import toast from 'react-hot-toast';

interface AutoApproveRule {
    Role: string;
    RoomType: string;
}

const SystemSettingsPage: React.FC = () => {
    const { user } = useAuth();
    const [settings, setSettings] = useState<SystemConfiguration[]>([]);
    const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'booking' | 'classroom' | 'equipment' | 'notification' | 'security'>('booking');
    const [ruleBuilderExpanded, setRuleBuilderExpanded] = useState(true);

    const isAdmin = user?.role === 'Admin';
    const isBookingStaff = user?.role === 'BookingStaff';

    const roles = ['Lecturer', 'Student'];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [settingsData, roomTypesData] = await Promise.all([
                configService.getAllSettings(),
                roomTypeService.getAll()
            ]);
            setSettings(settingsData);
            setRoomTypes(roomTypesData);
        } catch (error) {
            toast.error('Không thể tải dữ liệu cấu hình');
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
        const hiddenKeys = [
            'Security.ActiveBookingStaffId', 
            'Security.ActiveBookingStaffSessionId',
            'Booking.StartHour',
            'Booking.EndHour',
            'Booking.SlotDurationMinutes',
            'Booking.MaxDurationHours'
        ];

        let filtered = settings.filter(s => s.key.startsWith(prefix) && !hiddenKeys.includes(s.key));

        if (isBookingStaff) {
            const allowedForStaff = [
                'Booking.AutoApproveEnabled',
                'Booking.AutoApproveRules'
            ];
            filtered = filtered.filter(s => allowedForStaff.includes(s.key));
        }

        return filtered;
    };

    const renderRuleBuilder = (s: SystemConfiguration) => {
        let rules: AutoApproveRule[] = [];
        try {
            rules = JSON.parse(s.value || '[]');
        } catch (e) {
            rules = [];
        }

        const updateRules = (newRules: AutoApproveRule[]) => {
            handleUpdate(s.key, JSON.stringify(newRules));
        };

        const addRule = () => {
            updateRules([...rules, { Role: 'Lecturer', RoomType: roomTypes[0]?.name || '*' }]);
        };

        const removeRule = (index: number) => {
            updateRules(rules.filter((_, i) => i !== index));
        };

        const updateRule = (index: number, field: keyof AutoApproveRule, value: string) => {
            const newRules = [...rules];
            newRules[index] = { ...newRules[index], [field]: value };
            updateRules(newRules);
        };

        const toggleRoomType = (index: number, typeName: string) => {
            const rule = rules[index];
            let currentTypes = rule.RoomType === '*' ? [] : rule.RoomType.split(',').filter(t => t.trim() !== '');
            
            if (currentTypes.includes(typeName)) {
                currentTypes = currentTypes.filter(t => t !== typeName);
            } else {
                currentTypes.push(typeName);
            }
            
            updateRule(index, 'RoomType', currentTypes.length === 0 ? '*' : currentTypes.join(','));
        };

        const setAllRoomTypes = (index: number) => {
            updateRule(index, 'RoomType', '*');
        };

        return (
            <div style={{ width: '100%', marginTop: '1rem' }}>
                <button 
                    onClick={() => setRuleBuilderExpanded(!ruleBuilderExpanded)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-primary)',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: '0.5rem 0',
                        fontSize: '0.9rem',
                        transition: 'color 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary-700)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
                >
                    {ruleBuilderExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    {ruleBuilderExpanded ? 'Thu gọn danh sách quy tắc' : `Cấu hình quy tắc (${rules.length})`}
                </button>

                {ruleBuilderExpanded && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
                    {rules.map((rule, idx) => (
                        <div key={idx} style={{ 
                            display: 'flex', 
                            flexDirection: 'column',
                            gap: '1rem', 
                            padding: '1.5rem', 
                            backgroundColor: 'white', 
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--border-color)',
                            boxShadow: 'var(--shadow-sm)',
                            position: 'relative'
                        }}>
                            <button 
                                onClick={() => removeRule(idx)}
                                style={{ 
                                    position: 'absolute',
                                    top: '1rem',
                                    right: '1rem',
                                    padding: '0.5rem', 
                                    color: 'var(--red-500)', 
                                    background: 'var(--red-50)', 
                                    border: 'none', 
                                    borderRadius: '50%',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--red-100)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--red-50)'}
                            >
                                <Trash2 size={18} />
                            </button>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ fontWeight: 600, color: 'var(--text-main)', minWidth: '120px' }}>Vai trò áp dụng:</div>
                                <select 
                                    value={rule.Role}
                                    onChange={(e) => updateRule(idx, 'Role', e.target.value)}
                                    className="form-input"
                                    style={{ width: 'auto', padding: '0.5rem 1rem', minWidth: '200px' }}
                                >
                                    {roles.map(r => <option key={r} value={r}>{r === '*' ? 'Tất cả vai trò' : r}</option>)}
                                </select>
                            </div>

                            <div>
                                <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.75rem' }}>Loại phòng được phê duyệt:</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                                    <button
                                        onClick={() => setAllRoomTypes(idx)}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            borderRadius: 'var(--radius-md)',
                                            border: '1px solid ' + (rule.RoomType === '*' ? 'var(--color-primary)' : 'var(--border-color)'),
                                            backgroundColor: rule.RoomType === '*' ? 'var(--primary-50)' : 'white',
                                            color: rule.RoomType === '*' ? 'var(--color-primary)' : 'var(--text-muted)',
                                            fontSize: '0.875rem',
                                            fontWeight: rule.RoomType === '*' ? 600 : 500,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        Tất cả loại phòng
                                    </button>
                                    {roomTypes.map(rt => {
                                        const isSelected = rule.RoomType !== '*' && rule.RoomType.split(',').includes(rt.name);
                                        return (
                                            <button
                                                key={rt.id}
                                                onClick={() => toggleRoomType(idx, rt.name)}
                                                style={{
                                                    padding: '0.5rem 1rem',
                                                    borderRadius: 'var(--radius-md)',
                                                    border: '1px solid ' + (isSelected ? 'var(--color-primary)' : 'var(--border-color)'),
                                                    backgroundColor: isSelected ? 'var(--primary-50)' : 'white',
                                                    color: isSelected ? 'var(--color-primary)' : 'var(--text-muted)',
                                                    fontSize: '0.875rem',
                                                    fontWeight: isSelected ? 600 : 500,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                {rt.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ))}
                    <button 
                        onClick={addRule}
                        style={{ 
                            alignSelf: 'center', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            gap: '0.5rem', 
                            padding: '0.75rem 1.5rem',
                            backgroundColor: 'var(--primary-50)',
                            color: 'var(--color-primary)',
                            border: '1px dashed var(--color-primary)',
                            borderRadius: 'var(--radius-md)',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            width: '100%',
                            marginTop: '0.5rem'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--primary-100)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--primary-50)';
                        }}
                    >
                        <Plus size={20} /> Thêm quy tắc mới
                    </button>
                </div>
                )}
            </div>
        );
    };

    const renderSettingRow = (s: SystemConfiguration) => {
        const isBoolean = s.value.toLowerCase() === 'true' || s.value.toLowerCase() === 'false';
        const boolValue = s.value.toLowerCase() === 'true';
        const isRuleBuilder = s.key === 'Booking.AutoApproveRules';

        return (
            <div key={s.key} style={{ 
                display: 'flex', 
                flexDirection: isRuleBuilder ? 'column' : 'row',
                justifyContent: 'space-between', 
                alignItems: isRuleBuilder ? 'flex-start' : 'center', 
                padding: '1.25rem', 
                borderBottom: '1px solid var(--border-color)',
                transition: 'background-color 0.2s ease'
            }}>
                <div style={{ flex: '1', marginRight: '1.5rem', width: '100%' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>{s.key}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{s.description}</div>
                    {isRuleBuilder && renderRuleBuilder(s)}
                </div>
                {!isRuleBuilder && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: '280px', justifyContent: 'flex-end' }}>
                        {isBoolean ? (
                            <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                                <input
                                    type="checkbox"
                                    checked={boolValue}
                                    onChange={(e) => handleUpdate(s.key, e.target.checked.toString())}
                                    style={{ opacity: 0, width: 0, height: 0 }}
                                />
                                <span style={{
                                    position: 'absolute',
                                    cursor: 'pointer',
                                    top: 0, left: 0, right: 0, bottom: 0,
                                    backgroundColor: boolValue ? 'var(--color-primary)' : '#ccc',
                                    transition: '.4s',
                                    borderRadius: '24px'
                                }}>
                                    <span style={{
                                        position: 'absolute',
                                        content: '""',
                                        height: '18px', width: '18px',
                                        left: boolValue ? '22px' : '3px',
                                        bottom: '3px',
                                        backgroundColor: 'white',
                                        transition: '.4s',
                                        borderRadius: '50%'
                                    }}></span>
                                </span>
                            </label>
                        ) : (
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
                                style={{ maxWidth: '200px' }}
                            />
                        )}
                        <div style={{ width: '24px', display: 'flex', justifyContent: 'center' }}>
                            {saving === s.key && <RefreshCw size={18} className="spinner" style={{ color: 'var(--color-primary)' }} />}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const allTabs = [
        { id: 'booking', label: 'Quy tắc mượn phòng', icon: Calendar, prefix: 'Booking.' },
        { id: 'classroom', label: 'Phòng học', icon: Monitor, prefix: 'Classroom.' },
        { id: 'equipment', label: 'Thiết bị', icon: Wrench, prefix: 'Equipment.' },
        { id: 'notification', label: 'Thông báo', icon: Bell, prefix: 'Notification.' },
        { id: 'security', label: 'Bảo mật', icon: Shield, prefix: 'Security.' },
    ];

    const availableTabs = isBookingStaff ? allTabs.filter(t => t.id === 'booking') : allTabs;

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
                            {isBookingStaff ? 'Quản lý cấu hình phê duyệt tự động' : 'Quản lý các thông số vận hành và quy tắc nghiệp vụ toàn hệ thống'}
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
                        {availableTabs.map(tab => (
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
                                <strong>Lưu ý:</strong> Các thay đổi sẽ có hiệu lực ngay lập tức. {isAdmin && 'Hãy cẩn trọng khi sửa đổi các thông số lõi như thời gian hoạt động hoặc chính sách bảo mật.'}
                            </p>
                        </div>
                        
                        <div>
                            {availableTabs.map(tab => (
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
