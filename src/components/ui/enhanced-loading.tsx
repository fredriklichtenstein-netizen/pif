
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface EnhancedLoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

export function EnhancedLoading({ 
  size = 'md', 
  text, 
  fullScreen = false, 
  className 
}: EnhancedLoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className={cn('animate-spin text-primary', sizeClasses.lg)} />
          {text && (
            <p className={cn('text-muted-foreground', textSizeClasses.lg)}>
              {text}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center justify-center gap-2', className)}>
      <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
      {text && (
        <span className={cn('text-muted-foreground', textSizeClasses[size])}>
          {text}
        </span>
      )}
    </div>
  );
}
