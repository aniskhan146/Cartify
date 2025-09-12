import React from 'react';
import { cn } from '../../lib/utils';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isLoading?: boolean;
  confirmButtonText?: string;
  confirmButtonVariant?: 'destructive' | 'primary' | 'warning';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  isLoading = false,
  confirmButtonText = 'Confirm',
  confirmButtonVariant = 'destructive',
}) => {
  if (!isOpen) {
    return null;
  }

  const buttonClasses = {
      'destructive': 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      'primary': 'bg-primary text-primary-foreground hover:bg-primary/90',
      'warning': 'bg-yellow-500 text-black hover:bg-yellow-600',
  };


  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-[70] modal-backdrop"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-card rounded-lg shadow-xl p-6 w-full max-w-md relative modal-content border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-foreground mb-4">{title}</h2>
        <p className="text-muted-foreground mb-6">{message}</p>
        <div className="flex justify-end items-center space-x-3 border-t border-border pt-4">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg font-semibold bg-secondary text-secondary-foreground hover:bg-accent transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
                "px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-70 disabled:cursor-wait",
                buttonClasses[confirmButtonVariant]
            )}
          >
            {isLoading ? 'Processing...' : confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;