import React, { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

export const NotificationMenu: React.FC = () => {
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

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

        if (link) {
            window.location.href = link;
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
                <div className="glass-card" style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    width: '350px',
                    maxHeight: '400px',
                    overflowY: 'auto',
                    backgroundColor: 'var(--bg-surface)',
                    boxShadow: 'var(--shadow-lg)',
                    borderRadius: 'var(--radius-md)',
                    zIndex: 1000,
                    padding: '0',
                    border: '1px solid var(--border-glass)'
                }}>
                    <div style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid var(--border-glass)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        position: 'sticky',
                        top: 0,
                        backgroundColor: 'var(--bg-surface)',
                        zIndex: 10
                    }}>
                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Thông báo</h4>
                        {unreadCount > 0 && (
                            <button
                                onClick={() => markAllAsRead()}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--primary-600)',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    padding: 0
                                }}
                            >
                                Đánh dấu tất cả đã đọc
                            </button>
                        )}
                    </div>

                    <div style={{ padding: '0' }}>
                        {notifications.length === 0 ? (
                            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                <Bell size={48} style={{ opacity: 0.2, marginBottom: '8px' }} />
                                <p style={{ margin: 0 }}>Không có thông báo nào</p>
                            </div>
                        ) : (
                            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                                {notifications.map(notification => (
                                    <li
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification.id, notification.isRead, notification.link)}
                                        style={{
                                            padding: '12px 16px',
                                            borderBottom: '1px solid var(--border-glass)',
                                            backgroundColor: notification.isRead ? 'transparent' : 'var(--primary-50)',
                                            cursor: 'pointer',
                                            transition: 'background-color 0.2s',
                                        }}
                                        onMouseEnter={(e) => {
                                            if (notification.isRead) e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                                        }}
                                        onMouseLeave={(e) => {
                                            if (notification.isRead) e.currentTarget.style.backgroundColor = 'transparent';
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                            <strong style={{
                                                fontSize: '14px',
                                                color: notification.isRead ? 'var(--text-main)' : 'var(--primary-700)',
                                                fontWeight: notification.isRead ? 500 : 700
                                            }}>
                                                {notification.title}
                                            </strong>
                                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', marginLeft: '8px' }}>
                                                {new Date(notification.createdAt).toLocaleDateString('vi-VN')}
                                            </span>
                                        </div>
                                        <p style={{ margin: 0, fontSize: '13px', color: notification.isRead ? 'var(--text-muted)' : 'var(--text-main)' }}>
                                            {notification.message}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
