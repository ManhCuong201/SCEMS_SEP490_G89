import React, { useEffect, useState } from 'react';
import { Bell, CheckCircle2, ChevronRight, Inbox, Clock, Calendar } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';

const NotificationsPage: React.FC = () => {
    const { notifications, fetchAllNotifications, markAsRead, markAllAsRead } = useNotification();
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchAllNotifications(100).finally(() => setLoading(false));
    }, []);

    const handleNotificationClick = async (id: string, isRead: boolean, link?: string) => {
        if (!isRead) {
            await markAsRead(id);
        }

        if (link) {
            if (link.startsWith('http')) {
                window.location.href = link;
            } else {
                navigate(link);
            }
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <div className="spinner"></div>
                <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Đang tải thông báo...</p>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem'
            }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                        Thông báo của tôi
                    </h1>
                    <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        Quản lý tất cả cập nhật và nhắc nhở từ hệ thống
                    </p>
                </div>
                {notifications.some(n => !n.isRead) && (
                    <button
                        onClick={markAllAsRead}
                        className="btn-glass"
                        style={{
                            fontSize: '0.85rem',
                            padding: '0.5rem 1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            color: 'var(--color-primary)'
                        }}
                    >
                        <CheckCircle2 size={16} /> Đánh dấu tất cả đã đọc
                    </button>
                )}
            </div>

            <div className="glass-card shadow-premium" style={{ padding: 0, overflow: 'hidden' }}>
                {notifications.length === 0 ? (
                    <div style={{ padding: '5rem 2rem', textAlign: 'center' }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--color-bg-alt)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.5rem'
                        }}>
                            <Inbox size={40} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                        </div>
                        <h3 style={{ margin: '0 0 0.5rem', fontWeight: 600 }}>Hộp thư trống</h3>
                        <p style={{ color: 'var(--text-muted)', margin: 0 }}>Bạn không có thông báo nào vào lúc này.</p>
                    </div>
                ) : (
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                        {notifications.map((notification) => (
                            <li
                                key={notification.id}
                                onClick={() => handleNotificationClick(notification.id, notification.isRead, notification.link)}
                                style={{
                                    padding: '1.25rem 1.5rem',
                                    borderBottom: '1px solid var(--border-light)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    backgroundColor: notification.isRead ? 'transparent' : 'rgba(59, 130, 246, 0.03)',
                                    display: 'flex',
                                    gap: '1.25rem',
                                    alignItems: 'flex-start'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'var(--color-bg-alt)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = notification.isRead ? 'transparent' : 'rgba(59, 130, 246, 0.03)';
                                }}
                            >
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '12px',
                                    backgroundColor: notification.isRead ? 'var(--color-bg-alt)' : 'rgba(59, 130, 246, 0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    color: notification.isRead ? 'var(--text-muted)' : 'var(--color-primary)'
                                }}>
                                    <Bell size={20} />
                                </div>

                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                                        <h4 style={{
                                            margin: 0,
                                            fontSize: '1rem',
                                            fontWeight: notification.isRead ? 500 : 700,
                                            color: notification.isRead ? 'var(--text-main)' : 'var(--color-primary)'
                                        }}>
                                            {notification.title}
                                        </h4>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            color: 'var(--text-muted)',
                                            fontSize: '0.75rem',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            <Clock size={12} /> {new Date(notification.createdAt).toLocaleDateString('vi-VN')} {new Date(notification.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                    <p style={{
                                        margin: '0 0 0.5rem',
                                        fontSize: '0.9rem',
                                        color: 'var(--text-muted)',
                                        lineHeight: '1.5'
                                    }}>
                                        {notification.message}
                                    </p>

                                    {notification.link && (
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            color: 'var(--color-primary)',
                                            fontSize: '0.8rem',
                                            fontWeight: 600,
                                            gap: '4px'
                                        }}>
                                            Xem chi tiết <ChevronRight size={14} />
                                        </div>
                                    )}
                                </div>

                                {!notification.isRead && (
                                    <div style={{
                                        width: '10px',
                                        height: '10px',
                                        borderRadius: '50%',
                                        backgroundColor: 'var(--color-primary)',
                                        boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.1)',
                                        marginTop: '6px',
                                        flexShrink: 0
                                    }} />
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;
