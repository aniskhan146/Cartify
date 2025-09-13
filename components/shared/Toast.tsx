import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckIcon } from './icons';

interface ToastProps {
  message: string;
  show: boolean;
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, show, onClose, duration = 3000 }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);
  
  // FIX: Refactored animation props to use variants for compatibility with newer framer-motion versions.
  const toastVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.3 },
    visible: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 20, scale: 0.5 },
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          variants={toastVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center space-x-2 z-[150]"
        >
          <CheckIcon className="h-5 w-5" />
          <span>{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;