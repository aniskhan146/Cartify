import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckIcon, XIcon, AlertTriangleIcon } from './icons';
import { NotificationType } from '../../types';

interface NotificationProps {
  id: number;
  message: string;
  type: NotificationType;
  onDismiss: (id: number) => void;
}

const icons: Record<NotificationType, React.ReactNode> = {
  success: <CheckIcon className="h-6 w-6 text-green-500" />,
  error: <XIcon className="h-6 w-6 text-red-500" />,
  info: <AlertTriangleIcon className="h-6 w-6 text-blue-500" />,
  'new-order': <CheckIcon className="h-6 w-6 text-green-500" />,
  'new-user': <CheckIcon className="h-6 w-6 text-green-500" />,
  'low-stock': <AlertTriangleIcon className="h-6 w-6 text-yellow-500" />,
};

const containerClasses: Record<NotificationType, string> = {
  success: 'bg-green-500/10 border-green-500/50 text-green-700 dark:text-green-300',
  error: 'bg-red-500/10 border-red-500/50 text-red-700 dark:text-red-300',
  info: 'bg-blue-500/10 border-blue-500/50 text-blue-700 dark:text-blue-300',
  'new-order': 'bg-green-500/10 border-green-500/50 text-green-700 dark:text-green-300',
  'new-user': 'bg-green-500/10 border-green-500/50 text-green-700 dark:text-green-300',
  'low-stock': 'bg-yellow-500/10 border-yellow-500/50 text-yellow-700 dark:text-yellow-300',
};

const Notification: React.FC<NotificationProps> = ({ id, message, type, onDismiss }) => {
  const [exit, setExit] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExit(true);
      setTimeout(() => onDismiss(id), 400); // Allow time for exit animation
    }, 5000);

    return () => clearTimeout(timer);
  }, [id, onDismiss]);

  const handleDismiss = () => {
    setExit(true);
    setTimeout(() => onDismiss(id), 400);
  };

  // FIX: Refactored animation props to use variants for compatibility with newer framer-motion versions.
  const notificationVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.5 },
    visible: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 20, scale: 0.5, transition: { duration: 0.3 } },
  };

  return (
    <motion.div
      layout
      variants={notificationVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={`relative w-full max-w-sm p-4 rounded-lg shadow-lg border backdrop-blur-md ${containerClasses[type]}`}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">{icons[type]}</div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium ">{message}</p>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            onClick={handleDismiss}
            className="inline-flex rounded-md text-current/70 hover:text-current/100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
          >
            <span className="sr-only">Close</span>
            <XIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default Notification;