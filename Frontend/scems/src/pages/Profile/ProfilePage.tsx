import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Hash, Shield, Key } from 'lucide-react';
import profileService, { ProfileResponse } from '../../services/profile.service';
import { Loading } from '../../components/Common/Loading';
import { Alert } from '../../components/Common/Alert';
import { useAuth } from '../../context/AuthContext';

export const ProfilePage: React.FC = () => {
    const { user, login } = useAuth(); // Assuming login context updates user state
    const [profile, setProfile] = useState<ProfileResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // Form states
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [activeTab, setActiveTab] = useState<'info' | 'security'>('info');

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const data = await profileService.getMyProfile();
            setProfile(data);
            setFullName(data.fullName);
            setPhone(data.phone || '');
        } catch (err: any) {
            setError('Không thể tải thông tin hồ sơ');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateInfo = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!fullName.trim()) {
            setError('Họ và tên không được để trống');
            return;
        }

        try {
            setSaving(true);
            const updatedProfile = await profileService.updateProfile({ fullName, phone });
            setProfile(updatedProfile);
            setSuccess('Cập nhật thông tin thành công');
            
            // To immediately show new name in the top right Header if using AuthContext state:
            // This is optional depending on if your context re-fetches or can be mutated safely.
            // If the UI is built with JWT, just showing success is fine until they re-login.
        } catch (err: any) {
            setError(err.response?.data?.message || 'Cập nhật thông tin thất bại');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!currentPassword) {
            setError('Vui lòng nhập mật khẩu hiện tại');
            return;
        }

        if (newPassword.length < 6) {
            setError('Mật khẩu mới phải có ít nhất 6 ký tự');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            return;
        }

        try {
            setSaving(true);
            const result = await profileService.changePassword({ currentPassword, newPassword });
            setSuccess(result.message || 'Cập nhật mật khẩu thành công');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Đổi mật khẩu thất bại');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Loading />;
    if (!profile) return <div className="page-container">Không tìm thấy thông tin.</div>;

    const translateRole = (role: string) => {
        switch (role) {
            case 'Admin': return 'Quản trị viên';
            case 'BookingStaff': return 'Nhân viên xếp phòng';
            case 'Lecturer': return 'Giảng viên';
            case 'Student': return 'Sinh viên';
            default: return role;
        }
    };

    return (
        <div className="page-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="page-header">
                <div>
                    <h1>Hồ sơ cá nhân</h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Quản lý thông tin tài khoản và bảo mật</p>
                </div>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}
            {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

            <div className="glass-panel" style={{ overflow: 'hidden' }}>
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border-glass)' }}>
                    <button 
                        className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
                        onClick={() => setActiveTab('info')}
                        style={{ flex: 1, padding: '1rem', background: activeTab === 'info' ? 'var(--bg-glass)' : 'transparent', border: 'none', borderBottom: activeTab === 'info' ? '2px solid var(--primary-500)' : '2px solid transparent', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', color: activeTab === 'info' ? 'var(--primary-600)' : 'var(--text-muted)' }}
                    >
                        <User size={18} />
                        Thông tin cá nhân
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
                        onClick={() => setActiveTab('security')}
                        style={{ flex: 1, padding: '1rem', background: activeTab === 'security' ? 'var(--bg-glass)' : 'transparent', border: 'none', borderBottom: activeTab === 'security' ? '2px solid var(--primary-500)' : '2px solid transparent', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', color: activeTab === 'security' ? 'var(--primary-600)' : 'var(--text-muted)' }}
                    >
                        <Shield size={18} />
                        Bảo mật
                    </button>
                </div>

                <div style={{ padding: '2rem' }}>
                    {activeTab === 'info' ? (
                        <form onSubmit={handleUpdateInfo} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div className="form-group">
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Mail size={16} /> Email (Không thể thay đổi)
                                    </label>
                                    <input type="email" className="form-input" value={profile.email} disabled style={{ background: 'var(--bg-surface)' }} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Shield size={16} /> Vai trò
                                    </label>
                                    <input type="text" className="form-input" value={translateRole(profile.role)} disabled style={{ background: 'var(--bg-surface)' }} />
                                </div>
                            </div>
                            
                            {profile.studentCode && (
                                <div className="form-group">
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Hash size={16} /> Mã Sinh viên / Giảng viên
                                    </label>
                                    <input type="text" className="form-input" value={profile.studentCode} disabled style={{ background: 'var(--bg-surface)' }} />
                                </div>
                            )}

                            <div className="form-group">
                                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <User size={16} /> Họ và tên *
                                </label>
                                <input 
                                    type="text" 
                                    className="form-input" 
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Nhập họ và tên"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Phone size={16} /> Số điện thoại
                                </label>
                                <input 
                                    type="tel" 
                                    className="form-input" 
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="Nhập số điện thoại"
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                <button type="submit" className={`btn btn-primary ${saving ? 'disabled' : ''}`} disabled={saving}>
                                    {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '500px', margin: '0 auto' }}>
                            <div className="form-group">
                                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Key size={16} /> Mật khẩu hiện tại *
                                </label>
                                <input 
                                    type="password" 
                                    className="form-input" 
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="Nhập mật khẩu hiện tại"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Mật khẩu mới *</label>
                                <input 
                                    type="password" 
                                    className="form-input" 
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Ít nhất 6 ký tự"
                                    required
                                    minLength={6}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Xác nhận mật khẩu mới *</label>
                                <input 
                                    type="password" 
                                    className="form-input" 
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Nhập lại mật khẩu mới"
                                    required
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                <button type="submit" className={`btn btn-primary ${saving ? 'disabled' : ''}`} disabled={saving}>
                                    {saving ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
