import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useNotification } from '../../contexts/NotificationContext';
import Notification from './Notification';

const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotification();

  return (
    <div
      aria-live="assertive"
      className="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-[200]"
    >
      <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
        <AnimatePresence>
          {notifications.map(notification => (
            <Notification
              key={notification.id}
              id={notification.id}
              message={notification.message}
              type={notification.type}
              onDismiss={removeNotification}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default NotificationContainer;