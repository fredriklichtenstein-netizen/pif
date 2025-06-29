
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface SlideInProps {
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right';
  delay?: number;
  duration?: number;
  className?: string;
}

export function SlideIn({ 
  children, 
  direction = 'up', 
  delay = 0, 
  duration = 300, 
  className 
}: SlideInProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const getTransform = () => {
    if (isVisible) return 'translate-x-0 translate-y-0';
    
    switch (direction) {
      case 'up': return 'translate-y-4';
      case 'down': return '-translate-y-4';
      case 'left': return 'translate-x-4';
      case 'right': return '-translate-x-4';
      default: return 'translate-y-4';
    }
  };

  return (
    <div
      className={cn(
        'transition-all ease-in-out',
        isVisible ? 'opacity-100' : 'opacity-0',
        getTransform(),
        className
      )}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
}
