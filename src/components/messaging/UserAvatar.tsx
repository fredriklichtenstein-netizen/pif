import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  src?: string | null;
  name: string;
  initial: string;
  className?: string;
  imgClassName?: string;
}

/**
 * Avatar that gracefully falls back to user initials when no image is
 * available or when the image fails to load. Prevents broken "U" placeholders.
 */
export function UserAvatar({
  src,
  name,
  initial,
  className,
  imgClassName,
}: UserAvatarProps) {
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    setErrored(false);
  }, [src]);

  const showImage = !!src && !errored;

  return (
    <div
      className={cn(
        "rounded-full bg-muted flex-shrink-0 overflow-hidden flex items-center justify-center text-muted-foreground font-medium",
        className
      )}
      aria-label={name}
    >
      {showImage ? (
        <img
          src={src!}
          alt={name}
          className={cn("h-full w-full object-cover", imgClassName)}
          onError={() => setErrored(true)}
        />
      ) : (
        <span aria-hidden="true">{initial}</span>
      )}
    </div>
  );
}
