import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

export interface ActiveFilterChip {
  key: string;
  label: string;
  onRemove: () => void;
}

/**
 * Removable chips for whatever is currently narrowing the feed, under the
 * Filtrera/sort toolbar -- so a filter set inside the sheet stays visible
 * and is one tap to undo without reopening it.
 */
export function FeedActiveFilterChips({ chips, onClearAll }: { chips: ActiveFilterChip[]; onClearAll: () => void }) {
  const { t } = useTranslation();
  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5" aria-label={t("feed.active_filters", "Aktiva filter")}>
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.onRemove}
          aria-label={t("feed.remove_filter", { label: chip.label, defaultValue: `Ta bort filter: ${chip.label}` })}
          className="inline-flex h-7 items-center gap-1 rounded-full bg-primary/10 px-2.5 text-xs font-medium text-primary hover:bg-primary/20"
        >
          {chip.label}
          <X className="h-3 w-3" />
        </button>
      ))}
      {chips.length > 1 && (
        <button
          type="button"
          onClick={onClearAll}
          className="h-7 px-1.5 text-xs font-medium text-muted-foreground underline-offset-2 hover:underline"
        >
          {t("feed.clear_all_filters", "Rensa alla")}
        </button>
      )}
    </div>
  );
}
