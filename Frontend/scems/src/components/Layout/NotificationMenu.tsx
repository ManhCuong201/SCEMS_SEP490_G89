import React, { useState, useRef, useEffect } from 'react';
import { Bell, List } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { useNavigate, Link } from 'react-router-dom';

export const NotificationMenu: React.FC = () => {
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleNotificationClick = async (id: string, isRead: boolean, link?: string) => {
        if (!isRead) {
            await markAsRead(id);
        }
        setIsOpen(false);

        if (link) {
            if (link.startsWith('http')) {
                window.location.href = link;
            } else {
                navigate(link);
            }
        }
    };

    return (
        <div ref={menuRef} style={{ position: 'relative' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    position: 'relative',
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-main)',
                }}
            >
                <Bell size={24} />
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '2px',
                        right: '4px',
                        background: 'var(--color-danger)',
                        color: 'white',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        padding: '2px 6px',
                        borderRadius: '10px',
                        border: '2px solid var(--bg-surface)'
                    }}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="glass-card shadow-premium" style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    width: '350px',
                    maxHeight: '500px',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: 'var(--bg-surface)',
                    boxShadow: 'var(--shadow-xl)',
                    borderRadius: 'var(--radius-lg)',
                    zIndex: 1000,
                    padding: '0',
                    border: '1px solid var(--border-glass)',
                    marginTop: '0.5rem'
                }}>
                    <div style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid var(--border-glass)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: 'var(--bg-surface)',
                    }}>
                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Thông báo</h4>
                        {unreadCount > 0 && (
                            <button
                                onClick={() => markAllAsRead()}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--color-primary)',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    padding: 0,
                                    fontWeight: 500
                                }}
                            >
                                Đánh dấu tất cả đã đọc
                            </button>
                        )}
                    </div>

                    <div style={{ padding: '0', overflowY: 'auto', flex: 1 }}>
                        {notifications.length === 0 ? (
                            <div style={{ padding: '32px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                <Bell size={40} style={{ opacity: 0.15, marginBottom: '12px' }} />
                                <p style={{ margin: 0, fontSize: '14px' }}>Không có thông báo mới nào</p>
                            </div>
                        ) : (
                            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                                {notifications.slice(0, 10).map(notification => (
                                    <li
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification.id, notification.isRead, notification.link)}
                                        style={{
                                            padding: '12px 16px',
                                            borderBottom: '1px solid var(--border-light)',
                                            backgroundColor: notification.isRead ? 'transparent' : 'rgba(59, 130, 246, 0.05)',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = 'var(--color-bg-alt)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = notification.isRead ? 'transparent' : 'rgba(59, 130, 246, 0.05)';
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                            <strong style={{
                                                fontSize: '13px',
                                                color: notification.isRead ? 'var(--text-main)' : 'var(--color-primary)',
                                                fontWeight: notification.isRead ? 500 : 700
                                            }}>
                                                {notification.title}
                                            </strong>
                                            {!notification.isRead && (
                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', marginTop: '4px' }} />
                                            )}
                                        </div>
                                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                                            {notification.message}
                                        </p>
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                            {new Date(notification.createdAt).toLocaleDateString('vi-VN')} {new Date(notification.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div style={{
                        padding: '10px 16px',
                        borderTop: '1px solid var(--border-glass)',
                        textAlign: 'center',
                        backgroundColor: 'var(--bg-surface)',
                    }}>
                        <Link
                            to="/notifications"
                            onClick={() => setIsOpen(false)}
                            style={{
                                color: 'var(--text-main)',
                                fontSize: '13px',
                                textDecoration: 'none',
                                fontWeight: 500,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px'
                            }}
                        >
                            <List size={14} /> Xem tất cả thông báo
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
};
