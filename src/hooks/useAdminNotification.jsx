import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const AdminNotificationContext = createContext();

export const useAdminNotification = () => useContext(AdminNotificationContext);

let notificationId = 0;

export const AdminNotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

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