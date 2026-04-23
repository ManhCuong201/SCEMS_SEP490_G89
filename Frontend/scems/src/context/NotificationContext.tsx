import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import * as signalR from '@microsoft/signalr';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export interface Notification {
    id: string;
    title: string;
    message: string;
    isRead: boolean;
    link?: string;
    createdAt: string;
}

interface NotificationContextProps {
    notifications: Notification[];
    unreadCount: number;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    fetchNotifications: () => Promise<void>;
    fetchAllNotifications: (count?: number) => Promise<any>;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user, token } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [connection, setConnection] = useState<signalR.HubConnection | null>(null);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const fetchNotifications = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/notifications/unread`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };

    const fetchAllNotifications = async (count: number = 50) => {
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/notifications?count=${count}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
                return data;
            }
        } catch (error) {
            console.error('Failed to fetch all notifications:', error);
        }
    };

    useEffect(() => {
        if (user && token) {
            // Initial fetch
            fetchNotifications();

            // Setup SignalR connection
            const newConnection = new signalR.HubConnectionBuilder()
                .withUrl(`${API_URL.replace('/api', '')}/notificationHub`, {
                    accessTokenFactory: () => token
                })
                .withAutomaticReconnect()
                .build();

            setConnection(newConnection);
        } else {
            // Cleanup on logout
            if (connection) {
                connection.stop();
                setConnection(null);
            }
            setNotifications([]);
        }
    }, [user, token]);

    useEffect(() => {
        if (connection) {
            connection.start()
                .then(() => {
                    console.log('SignalR Connected.');
                    connection.on('ReceiveNotification', (notification: Notification) => {
                        setNotifications(prev => [notification, ...prev]);
                        toast(notification.title, {
                            icon: '🔔',
                            style: {
                                borderRadius: 'var(--radius-md)',
                                background: 'var(--bg-surface)',
                                color: 'var(--text-main)',
                            },
                        });
                    });

                    connection.on('ForceLogout', (message: string) => {
                        toast.error(message, { duration: 5000 });
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        setTimeout(() => {
                            window.location.href = '/auth/login';
                        }, 2000);
                    });
                })
                .catch(e => console.log('SignalR Connection Error: ', e));

            return () => {
                connection.off('ReceiveNotification');
                connection.stop();
            };
        }
    }, [connection]);

    const markAsRead = async (id: string) => {
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/notifications/${id}/read`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            }
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/notifications/read-all`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            }
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    };

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, fetchNotifications, fetchAllNotifications } as any}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};
