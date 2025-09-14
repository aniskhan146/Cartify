import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const AdminNotificationContext = createContext();

export const useAdminNotification = () => useContext(AdminNotificationContext);

let notificationId = 0;

export const AdminNotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([
    {
      id: -1,
      category: 'Errors',
      title: 'Critical: Database Connection Error',
      message: 'Failed to establish a connection with the primary database. Some services may be unavailable. The system will attempt to reconnect automatically.',
      createdAt: new Date(Date.now() - 3600000), // 1 hour ago
      read: false,
    },
    {
      id: -2,
      category: 'Customers',
      title: 'New Customer Signup',
      message: 'A new user, john.doe@example.com, has registered an account.',
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