import { toast } from 'sonner';

/**
 * Utility functions for displaying toast notifications throughout the app
 */

export const showSuccess = (message: string) => {
  toast.success(message);
};

export const showError = (message: string) => {
  toast.error(message);
};

export const showInfo = (message: string) => {
  toast.info(message);
};

export const showWarning = (message: string) => {
  toast.warning(message);
};

export const showLoading = (message: string) => {
  return toast.loading(message);
};

export const dismissToast = (toastId: string | number) => {
  toast.dismiss(toastId);
};

/**
 * Show a confirmation dialog using toast
 * Returns a promise that resolves to true if confirmed, false if cancelled
 */
export const showConfirm = (
  message: string,
  options?: {
    confirmText?: string;
    cancelText?: string;
    description?: string;
  }
): Promise<boolean> => {
  return new Promise((resolve) => {
    toast(message, {
      description: options?.description,
      action: {
        label: options?.confirmText || 'Confirm',
        onClick: () => resolve(true),
      },
      cancel: {
        label: options?.cancelText || 'Cancel',
        onClick: () => resolve(false),
      },
    });
  });
};

/**
 * Show a promise toast that automatically updates based on promise state
 */
export const showPromise = <T,>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: Error) => string);
  }
) => {
  return toast.promise(promise, messages);
};
