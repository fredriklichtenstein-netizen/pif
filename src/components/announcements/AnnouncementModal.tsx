import { useEffect, useState } from "react";
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
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { useAnnouncements } from "@/hooks/useAnnouncements";

export function AnnouncementModal() {
  const { t, i18n } = useTranslation();
  const { announcements, dismiss } = useAnnouncements();
  const [api, setApi] = useState<CarouselApi>();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setIndex(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  if (announcements.length === 0) return null;

  const isLast = index === announcements.length - 1;
  const isSwedish = i18n.language?.startsWith("sv");

  const handleNext = () => {
    if (isLast) {
      dismiss();
    } else {
      api?.scrollNext();
    }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) dismiss(); }}>
      <DialogContent className="overflow-x-hidden sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            {t("announcements.heading")}
          </div>
        </DialogHeader>

        <Carousel setApi={setApi} opts={{ align: "start", loop: false }}>
          <CarouselContent>
            {announcements.map((a) => (
              <CarouselItem key={a.id}>
                <DialogTitle>{isSwedish ? a.title_sv : a.title_en}</DialogTitle>
                <DialogDescription className="whitespace-pre-wrap text-foreground pt-2">
                  {isSwedish ? a.body_sv : a.body_en}
                </DialogDescription>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        <DialogFooter className="grid w-full min-w-0 grid-cols-[1fr_auto] items-center gap-2 sm:grid-cols-[1fr_auto]">
          {announcements.length > 1 ? (
            <div className="flex min-w-0 gap-1.5" aria-hidden="true">
              {announcements.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${i === index ? "bg-primary" : "bg-muted"}`}
                />
              ))}
            </div>
          ) : (
            <span />
          )}
          <Button onClick={handleNext} size="sm" className="shrink-0 justify-self-end">
            {isLast ? t("announcements.done") : t("announcements.next")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
