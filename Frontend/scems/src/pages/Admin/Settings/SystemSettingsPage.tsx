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
            // Refresh local state without full reload
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
        <div key={s.key} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
            <div className="mb-2 sm:mb-0 mr-4">
                <div className="font-medium text-gray-900">{s.key}</div>
                <div className="text-sm text-gray-500">{s.description}</div>
            </div>
            <div className="flex items-center gap-2">
                <input
                    type="text"
                    defaultValue={s.value}
                    onBlur={(e) => {
                        if (e.target.value !== s.value) {
                            handleUpdate(s.key, e.target.value);
                        }
                    }}
                    className="w-full sm:w-48 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    disabled={saving === s.key}
                />
                {saving === s.key && <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />}
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
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    <Settings className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Cài đặt hệ thống</h1>
                    <p className="text-gray-500 text-sm">Quản lý các thông số vận hành và quy tắc nghiệp vụ toàn hệ thống</p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="flex border-b border-gray-200 overflow-x-auto scrollbar-hide">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                                    activeTab === tab.id
                                        ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="p-0">
                        <div className="bg-blue-50/50 p-4 border-b border-gray-100 flex items-start gap-3">
                            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-blue-800 science">
                                <strong>Lưu ý:</strong> Các thay đổi sẽ có hiệu lực ngay lập tức. Hãy cẩn trọng khi sửa đổi các thông số lõi như thời gian hoạt động hoặc chính sách bảo mật. 
                                Một số thay đổi có thể yêu cầu người dùng đăng nhập lại hoặc làm mới trang để áp dụng đầy đủ.
                            </p>
                        </div>
                        
                        <div className="divide-y divide-gray-100">
                            {tabs.map(tab => (
                                <div key={tab.id} className={activeTab === tab.id ? 'block' : 'hidden'}>
                                    {filterSettings(tab.prefix).length > 0 ? (
                                        filterSettings(tab.prefix).map(renderSettingRow)
                                    ) : (
                                        <div className="p-8 text-center text-gray-500 text-sm italic">
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
