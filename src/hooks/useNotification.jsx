import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

let notificationId = 0;

export const NotificationProvider = ({ children }) => {
  // Add some initial notifications for demonstration purposes
  const [notifications, setNotifications] = useState([
    {
      id: -1,
      type: 'info',
      title: 'AYExpress Updates',
      message: 'Welcome to the new and improved AYExpress! We have rolled out several updates to enhance your shopping experience.',
      createdAt: new Date(Date.now() - 3600000), // 1 hour ago
      read: true,
    },
    {
      id: -2,
      type: 'warning',
      title: 'Promotions',
      message: 'Our summer sale ends this week! Get up to 50% off on selected items. Don\'t miss out!',
      createdAt: new Date(Date.now() - 86400000), // 1 day ago
      read: false,
    },
  ]);

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