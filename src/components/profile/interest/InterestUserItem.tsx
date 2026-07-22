
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { sv, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { AvatarImage } from "@/components/ui/optimized-image";

interface InterestUserItemProps {
  user: {
    id: string;
    user_id?: string;
    users?: {
      first_name?: string;
      last_name?: string;
      avatar_url?: string;
    };
    profiles?: {
      first_name?: string;
      last_name?: string;
      avatar_url?: string;
    };
    status: string;
    created_at: string;
  };
  isOwner: boolean;
  onSelect: () => void;
}

export function InterestUserItem({ user, isOwner, onSelect }: InterestUserItemProps) {
  const { t, i18n } = useTranslation();
  const userProfileId = user.user_id || user.id;
  const profile = user.users || user.profiles || {};
  const locale = i18n.language?.startsWith("sv") ? sv : enUS;

  return (
    <div className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded-md transition-all">
      <Link
        to={`/feed?user=${userProfileId}`}
        className="flex items-center gap-2 hover:underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        <AvatarImage
          src={profile.avatar_url}
          size={28}
          alt={profile.first_name || "User"}
        />
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-sm font-medium truncate">
            {profile.first_name} {profile.last_name?.[0] || ""}
          </span>
          <span className="text-xs text-muted-foreground">
            {format(new Date(user.created_at), "d MMM HH:mm", { locale })}
          </span>
        </div>
      </Link>
      <div className="ml-auto flex items-center gap-2">
        {user.status === "selected" && (
          <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs whitespace-nowrap">
            {t("interactions.selected_badge")}
          </span>
        )}
        {user.status === "pending" && isOwner && (
          <Button
            size="sm"
            onClick={onSelect}
            className="text-xs py-1 px-2 h-auto whitespace-nowrap"
          >
            {t("interactions.select_btn")}
          </Button>
        )}
        {user.status === "not_selected" && (
          <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded text-xs whitespace-nowrap">
            {t("interactions.not_selected_badge")}
          </span>
        )}
      </div>
    </div>
  );
}
