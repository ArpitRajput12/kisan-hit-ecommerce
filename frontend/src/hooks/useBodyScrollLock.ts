import { useEffect } from 'react';

/**
 * Custom hook to lock body scroll when a modal, drawer, or dialog is active.
 * Restores original overflow style on unmount or when closed.
 */
export const useBodyScrollLock = (isLocked: boolean): void => {
  useEffect(() => {
    if (isLocked) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = originalOverflow || 'unset';
      };
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isLocked]);
};

export default useBodyScrollLock;

