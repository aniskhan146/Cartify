import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

let notificationId = 0;

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback(({ type = 'info', title, message }) => {
    const id = notificationId++;
    const newNotification = { id, type, title, message, createdAt: new Date(), read: false };
    // Add to the top and keep the list at a max of 50
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
    addNotification,
    markAllAsRead,
    clearNotifications,
  }), [notifications, unreadCount, addNotification, markAllAsRead, clearNotifications]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
