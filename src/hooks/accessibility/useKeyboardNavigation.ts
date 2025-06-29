
import { useEffect, useCallback } from 'react';

interface UseKeyboardNavigationProps {
  onEscape?: () => void;
  onEnter?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  isActive?: boolean;
}

export function useKeyboardNavigation({
  onEscape,
  onEnter,
  onArrowUp,
  onArrowDown,
  onArrowLeft,
  onArrowRight,
  isActive = true
}: UseKeyboardNavigationProps) {
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (!isActive) return;

    switch (event.key) {
      case 'Escape':
        onEscape?.();
        break;
      case 'Enter':
        onEnter?.();
        break;
      case 'ArrowUp':
        event.preventDefault();
        onArrowUp?.();
        break;
      case 'ArrowDown':
        event.preventDefault();
        onArrowDown?.();
        break;
      case 'ArrowLeft':
        onArrowLeft?.();
        break;
      case 'ArrowRight':
        onArrowRight?.();
        break;
    }
  }, [onEscape, onEnter, onArrowUp, onArrowDown, onArrowLeft, onArrowRight, isActive]);

  useEffect(() => {
    if (!isActive) return;

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress, isActive]);
}
