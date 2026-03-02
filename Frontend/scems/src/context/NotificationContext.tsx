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
            await fetch(`${API_URL}/api/notifications/${id}/read`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        if (!token) return;
        try {
            await fetch(`${API_URL}/api/notifications/read-all`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setNotifications([]);
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    };

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, fetchNotifications }}>
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
