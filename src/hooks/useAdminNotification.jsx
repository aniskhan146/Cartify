import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const AdminNotificationContext = createContext();

export const useAdminNotification = () => useContext(AdminNotificationContext);

let notificationId = 0;

export const AdminNotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([
    {
      id: -1,
      category: 'Orders',
      title: '🚀 Weekly Sales Goal Achieved!',
      message: 'Congratulations! The store has surpassed the weekly sales target. Keep up the great work!',
      createdAt: new Date(Date.now() - 3600000), // 1 hour ago
      read: false,
    },
    {
      id: -2,
      category: 'Customers',
      title: 'Welcome to the Admin Panel',
      message: 'This is an example notification. You can manage all store activities from here.',
      createdAt: new Date(Date.now() - 86400000), // 1 day ago
      read: true,
    },
  ]);

  const addAdminNotification = useCallback(({ category = 'info', title, message }) => {
    const id = notificationId++;
    const newNotification = { id, category, title, message, createdAt: new Date(), read: false };
    setNotifications(prev => [newNotification, ...prev].slice(0, 50));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  const value = useMemo(() => ({
    notifications,
    unreadCount,
    addAdminNotification,
    markAllAsRead,
    clearNotifications,
  }), [notifications, unreadCount, addAdminNotification, markAllAsRead, clearNotifications]);

  return (
    <AdminNotificationContext.Provider value={value}>
      {children}
    </AdminNotificationContext.Provider>
  );
};