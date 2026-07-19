import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAnnouncements } from "@/hooks/useAnnouncements";

export function AnnouncementModal() {
  const { t, i18n } = useTranslation();
  const { announcements, dismiss } = useAnnouncements();
  const [index, setIndex] = useState(0);

  if (announcements.length === 0) return null;

  const current = announcements[index];
  const isLast = index === announcements.length - 1;
  const isSwedish = i18n.language?.startsWith("sv");
  const title = isSwedish ? current.title_sv : current.title_en;
  const body = isSwedish ? current.body_sv : current.body_en;

  const handleNext = () => {
    if (isLast) {
      dismiss();
    } else {
      setIndex((i) => i + 1);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) dismiss(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            {t("announcements.heading")}
          </div>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="whitespace-pre-wrap text-foreground">
            {body}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-row items-center justify-between sm:justify-between">
          {announcements.length > 1 ? (
            <div className="flex gap-1.5" aria-hidden="true">
              {announcements.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 w-1.5 rounded-full ${i === index ? "bg-primary" : "bg-muted"}`}
                />
              ))}
            </div>
          ) : (
            <span />
          )}
          <Button onClick={handleNext} size="sm">
            {isLast ? t("announcements.done") : t("announcements.next")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
