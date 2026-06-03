import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { UserAvatar } from "./UserAvatar";
import type { Profile } from "@/types/messaging";

interface ProfilePopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile?: Profile | null;
  userId?: string;
  displayName: string;
  initial: string;
}

export function ProfilePopup({
  open,
  onOpenChange,
  profile,
  userId,
  displayName,
  initial,
}: ProfilePopupProps) {
  const { t } = useTranslation();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-w-md mx-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle className="sr-only">{displayName}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col items-center gap-3 pt-2 pb-4">
          <UserAvatar
            src={profile?.avatar_url}
            name={displayName}
            initial={initial}
            className="h-20 w-20 text-2xl"
          />
          <h3 className="text-lg font-semibold">{displayName}</h3>
          {profile?.bio?.trim() ? (
            <p className="text-sm text-muted-foreground text-center whitespace-pre-wrap">
              {profile.bio}
            </p>
          ) : null}
          {userId && (
            <Button asChild variant="outline" className="mt-2 w-full">
              <Link to={`/user/${userId}`} onClick={() => onOpenChange(false)}>
                {t("messages.view_full_profile", { defaultValue: "Visa profil" })}
              </Link>
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
