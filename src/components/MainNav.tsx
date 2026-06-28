import { House, Map, MessageSquare, LogIn } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { AvatarImage } from "@/components/ui/optimized-image";
import { useTranslation } from 'react-i18next';
import { useCachedProfile } from "@/hooks/profile/useCachedProfile";
import { useCachedAvatarSrc } from "@/hooks/profile/useCachedAvatarSrc";
import { useNotifications } from "@/hooks/useNotifications";
import { useUnreadMessagesCount } from "@/hooks/useUnreadMessagesCount";
import { resolveDisplayName } from "@/utils/displayName";

export function MainNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, initialized } = useGlobalAuth();
  const { t } = useTranslation();
  const { profile: cachedProfile } = useCachedProfile(user?.id);
  const avatarUrl = useCachedAvatarSrc(cachedProfile?.avatar_url ?? null);
  const { unreadCount: unreadNotifications } = useNotifications();
  const { unreadMessagesCount } = useUnreadMessagesCount();
  const combinedUnread = user ? unreadNotifications + unreadMessagesCount : 0;

  const isActive = (path: string) => location.pathname === path;
  const isProfileActive = isActive("/profile") || isActive("/account-settings");
  const isPostActive = isActive("/post");

  const currentFullPath = `${location.pathname}${location.search}${location.hash}`;

  const handleAuthRequiredClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!user) {
      e.preventDefault();
      navigate("/auth", { state: { from: currentFullPath } });
    }
  };

  const emailPrefix = user?.email ? user.email.split('@')[0] : '';
  const displayName = user ? resolveDisplayName(cachedProfile, emailPrefix) : '';

  const itemBase = "flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0 py-1";
  const activeColor = "text-primary";
  const inactiveColor = "text-muted-foreground";

  return (
    <nav
      className="fixed bottom-4 sm:bottom-3 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1rem)] max-w-md"
      aria-label={t('nav.explore_more', 'Navigation')}
    >
      <div className="bg-background/95 backdrop-blur border border-border rounded-full shadow-lg px-2 py-1.5 flex items-center">

        <Link
          to="/feed"
          className={`${itemBase} ${isActive("/feed") ? activeColor : inactiveColor}`}
        >
          <House size={22} />
          <span className="text-[10px] leading-none">{t('nav.pifs')}</span>
        </Link>

        <Link
          to="/map"
          className={`${itemBase} ${isActive("/map") ? activeColor : inactiveColor}`}
        >
          <Map size={22} />
          <span className="text-[10px] leading-none">{t('nav.map')}</span>
        </Link>

        <Link
          to="/post"
          onClick={handleAuthRequiredClick}
          className={`${itemBase} ${isPostActive ? activeColor : inactiveColor}`}
        >
          <span className="w-[22px] h-[22px] rounded-full overflow-hidden flex items-center justify-center bg-background">
            <img
              src="/lovable-uploads/53620c2b-b959-4ef7-9b15-68f286e62757.png"
              alt=""
              aria-hidden="true"
              className="w-full h-full object-cover"
            />
          </span>
          <span className="text-[10px] leading-none">{t('nav.post')}</span>
        </Link>

        <Link
          to="/messages"
          onClick={handleAuthRequiredClick}
          className={`${itemBase} ${isActive("/messages") ? activeColor : inactiveColor}`}
        >
          <span className="relative">
            <MessageSquare size={22} />
            {combinedUnread > 0 && (
              <span className="absolute -top-1 -right-2 rounded-full bg-primary text-primary-foreground text-[10px] font-medium px-1.5 py-0.5 min-w-[18px] text-center leading-none">
                {combinedUnread > 99 ? "99+" : combinedUnread}
              </span>
            )}
          </span>
          <span className="text-[10px] leading-none">{t('nav.messages')}</span>
        </Link>

        <Link
          to={initialized && !user ? "/auth" : "/profile"}
          state={initialized && !user ? { from: currentFullPath } : undefined}
          className={`${itemBase} ${isProfileActive ? activeColor : inactiveColor}`}
        >
          {user ? (
            <div className="w-[22px] h-[22px] rounded-full overflow-hidden">
              <AvatarImage
                src={avatarUrl ?? undefined}
                alt={displayName}
                size={22}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <LogIn size={22} />
          )}
          <span className="text-[10px] leading-none truncate max-w-full">
            {user ? t('nav.profile') : t('nav.sign_in', 'Sign in')}
          </span>
        </Link>
      </div>
    </nav>
  );
}
