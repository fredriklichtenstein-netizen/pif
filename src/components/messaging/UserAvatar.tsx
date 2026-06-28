import { AvatarImage } from "@/components/ui/optimized-image";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  src?: string | null;
  name: string;
  className?: string;
  /** Pixel size used for image optimization. Defaults to 40. */
  size?: number;
}

/**
 * Round avatar that always falls back to the shared hashed-animal photo
 * from `AvatarImage` when `src` is missing or fails to load. No text
 * initials are ever rendered as a fallback anywhere in the app.
 */
export function UserAvatar({
  src,
  name,
  className,
  size = 40,
}: UserAvatarProps) {
  return (
    <div
      className={cn(
        "rounded-full flex-shrink-0 overflow-hidden",
        className
      )}
      aria-label={name}
    >
      <AvatarImage
        src={src ?? undefined}
        alt={name}
        size={size}
        className="w-full h-full object-cover"
      />
    </div>
  );
}
