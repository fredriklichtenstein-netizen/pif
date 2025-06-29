
import { useEffect, useRef, useState } from 'react';

interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  minSwipeDistance?: number;
  maxSwipeTime?: number;
}

export function useSwipeGestures({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  minSwipeDistance = 50,
  maxSwipeTime = 300
}: SwipeGestureOptions) {
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const [isEnabled, setIsEnabled] = useState(true);

  const handleTouchStart = (e: TouchEvent) => {
    if (!isEnabled) return;
    
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (!isEnabled || !touchStartRef.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;

    // Check if swipe is fast enough and long enough
    if (deltaTime > maxSwipeTime) return;

    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    if (Math.max(absDeltaX, absDeltaY) < minSwipeDistance) return;

    // Determine swipe direction
    if (absDeltaX > absDeltaY) {
      // Horizontal swipe
      if (deltaX > 0) {
        onSwipeRight?.();
      } else {
        onSwipeLeft?.();
      }
    } else {
      // Vertical swipe
      if (deltaY > 0) {
        onSwipeDown?.();
      } else {
        onSwipeUp?.();
      }
    }

    touchStartRef.current = null;
  };

  useEffect(() => {
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isEnabled, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, minSwipeDistance, maxSwipeTime]);

  return {
    isEnabled,
    setIsEnabled
  };
}
