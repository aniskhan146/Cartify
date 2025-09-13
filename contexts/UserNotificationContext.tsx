import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { UserNotification } from '../types';
import { useAuth } from './AuthContext';
import { onUserNotificationsChange, markUserNotificationsAsRead } from '../services/databaseService';

interface UserNotificationContextType {
  notifications: UserNotification[];
  unreadCount: number;
  markAllAsRead: () => void;
}

const UserNotificationContext = createContext<UserNotificationContextType | undefined>(undefined);

export const useUserNotification = (): UserNotificationContextType => {
    const context = useContext(UserNotificationContext);
    if (context === undefined) {
        throw new Error('useUserNotification must be used within a UserNotificationProvider');
    }
    return context;
};

interface UserNotificationProviderProps {
    children: ReactNode;
}

export const UserNotificationProvider: React.FC<UserNotificationProviderProps> = ({ children }) => {
    const { currentUser } = useAuth();
    const [notifications, setNotifications] = useState<UserNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (currentUser) {
            const unsubscribe = onUserNotificationsChange(currentUser.id, (newNotifications) => {
                setNotifications(newNotifications);
                setUnreadCount(newNotifications.filter(n => !n.isRead).length);
            });
            return () => unsubscribe();
        } else {
            setNotifications([]);
            setUnreadCount(0);
        }
    }, [currentUser]);

    const markAllAsRead = useCallback(async () => {
        if (!currentUser || unreadCount === 0) return;
        
        const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
        
        // Optimistically update UI
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
        
        try {
            await markUserNotificationsAsRead(currentUser.id, unreadIds);
        } catch (error) {
            console.error("Failed to mark notifications as read:", error);
            // In a real-world app, you might revert the optimistic update here.
        }
    }, [currentUser, notifications, unreadCount]);

    const value: UserNotificationContextType = {
        notifications,
        unreadCount,
        markAllAsRead,
    };

    return (
        <UserNotificationContext.Provider value={value}>
            {children}
        </UserNotificationContext.Provider>
    );
};
