
import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

/**
 * Collection of commonly used skeleton patterns
 */
function AvatarSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn("h-10 w-10 rounded-full", className)} />;
}

function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      <Skeleton className="h-[240px] w-full rounded-lg" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-full" />
      </div>
    </div>
  );
}

function ProfileSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex justify-center">
        <Skeleton className="h-24 w-24 rounded-full" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}

export { Skeleton, AvatarSkeleton, CardSkeleton, ProfileSkeleton }
