import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  formatScheduleTime,
  fromLocalInputValue,
  maxScheduleDate,
  minScheduleDate,
  SCHEDULE_STEP_MINUTES,
  toLocalInputValue,
  validateSchedule,
} from "@/lib/schedule";

interface ScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Current schedule, if any -- pre-fills the picker. */
  initial?: Date | null;
  isSubmitting?: boolean;
  onConfirm: (date: Date) => void;
}

export function ScheduleDialog({ open, onOpenChange, initial, isSubmitting, onConfirm }: ScheduleDialogProps) {
  const { t, i18n } = useTranslation();
  const [value, setValue] = useState("");

  // Recompute bounds each time the dialog opens so a long-open page doesn't
  // offer a time that has slipped into the past.
  const bounds = useMemo(() => {
    const now = new Date();
    return { min: minScheduleDate(now), max: maxScheduleDate(now) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const start = initial && initial.getTime() >= bounds.min.getTime() ? initial : bounds.min;
    setValue(toLocalInputValue(start));
  }, [open, initial, bounds.min]);

  const date = fromLocalInputValue(value);
  const error = validateSchedule(date);
  const errorText =
    error === "too_soon"
      ? t("drafts.schedule_too_soon")
      : error === "too_far"
        ? t("drafts.schedule_too_far")
        : error === "invalid"
          ? t("drafts.schedule_invalid")
          : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("drafts.schedule_title")}</DialogTitle>
          <DialogDescription>{t("drafts.schedule_description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="schedule-at">{t("drafts.schedule_label")}</Label>
          <Input
            id="schedule-at"
            type="datetime-local"
            value={value}
            min={toLocalInputValue(bounds.min)}
            max={toLocalInputValue(bounds.max)}
            step={SCHEDULE_STEP_MINUTES * 60}
            onChange={(e) => setValue(e.target.value)}
          />
          {errorText ? (
            <p className="text-sm text-destructive">{errorText}</p>
          ) : date ? (
            <p className="text-sm text-muted-foreground">
              {t("drafts.schedule_preview", { when: formatScheduleTime(date, i18n.language) })}
            </p>
          ) : null}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            {t("post.cancel_button")}
          </Button>
          <Button
            type="button"
            onClick={() => date && !error && onConfirm(date)}
            disabled={!!error || isSubmitting}
          >
            {t("drafts.schedule_confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
