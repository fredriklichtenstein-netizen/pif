import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { useProfileSheetStore } from "@/stores/profileSheetStore";

interface ProfileLinkProps {
  userId: string;
  name?: string;
  avatar?: string;
  className?: string;
  children: ReactNode;
  /** Runs before the popup opens, e.g. to close the list it was tapped in. */
  onOpen?: () => void;
  "aria-label"?: string;
}

/**
 * A user's name/photo: opens their profile popup (UserProfileSheet). Logged-out
 * visitors go to sign in, as the old /feed?user= links did. Doesn't bubble,
 * so it can sit inside a tappable row or card.
 */
export function ProfileLink({ userId, name, avatar, className, children, onOpen, ...rest }: ProfileLinkProps) {
  const { user } = useGlobalAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const open = useProfileSheetStore((s) => s.open);

  return (
    <button
      type="button"
      className={className}
      aria-label={rest["aria-label"] ?? name}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) {
          navigate("/auth", { state: { from: location.pathname + location.search } });
          return;
        }
        onOpen?.();
        open({ id: userId, name, avatar });
      }}
    >
      {children}
    </button>
  );
}
