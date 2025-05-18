
import { ReactNode, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface FeedItemTransitionProps {
  children: ReactNode;
  transitionState?: 'removing' | 'archiving' | 'restoring' | 'normal';
  className?: string;
}

export function FeedItemTransition({
  children,
  transitionState = 'normal',
  className
}: FeedItemTransitionProps) {
  const [animate, setAnimate] = useState(false);
  
  // Apply animations after mount to ensure they trigger properly
  useEffect(() => {
    if (transitionState !== 'normal') {
      // Small delay to ensure the component has rendered
      const timer = setTimeout(() => setAnimate(true), 10);
      return () => clearTimeout(timer);
    } else {
      setAnimate(false);
    }
  }, [transitionState]);
  
  return (
    <div
      className={cn(
        "transition-all duration-500 ease-in-out overflow-hidden",
        animate && transitionState === 'removing' && "opacity-0 h-0 mb-0 scale-95 transform",
        animate && transitionState === 'archiving' && "opacity-60 scale-98 bg-muted/20",
        animate && transitionState === 'restoring' && "opacity-100 scale-102 shadow-lg bg-background",
        !animate && "opacity-100 h-auto",
        className
      )}
    >
      {children}
    </div>
  );
}
