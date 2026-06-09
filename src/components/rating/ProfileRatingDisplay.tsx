import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchUserRatingSummary, type UserRatingSummary } from "@/services/ratings";

interface Props {
  userId: string;
  className?: string;
}

const MIN_RATINGS = 10;

function PartialStar({ fillPct }: { fillPct: number }) {
  // 5-star scale, supports fractional fill via clip-path inset.
  const clamped = Math.max(0, Math.min(100, fillPct));
  return (
    <span className="relative inline-block w-4 h-4">
      {/* empty star outline */}
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="absolute inset-0 w-4 h-4 text-muted-foreground"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path
          strokeLinejoin="round"
          d="M12 2.5l2.92 6.18 6.58.96-4.76 4.79 1.13 6.7L12 17.96l-5.87 3.17 1.13-6.7L2.5 9.64l6.58-.96L12 2.5z"
        />
      </svg>
      {/* filled portion */}
      <span
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - clamped}% 0 0)` }}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 24 24"
          className="w-4 h-4 text-yellow-400"
          fill="currentColor"
        >
          <path d="M12 2.5l2.92 6.18 6.58.96-4.76 4.79 1.13 6.7L12 17.96l-5.87 3.17 1.13-6.7L2.5 9.64l6.58-.96L12 2.5z" />
        </svg>
      </span>
    </span>
  );
}

export function ProfileRatingDisplay({ userId, className }: Props) {
  const { t } = useTranslation();
  const [summary, setSummary] = useState<UserRatingSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    setSummary(null);
    fetchUserRatingSummary(userId).then((s) => {
      if (!cancelled) setSummary(s);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (!summary) return null;

  if (summary.count < MIN_RATINGS) {
    return (
      <div
        className={`text-xs text-muted-foreground ${className ?? ""}`}
        aria-label={t("profile.rating_not_enough", "Inte tillräckligt med betyg ännu")}
      >
        {t("profile.rating_not_enough", "Inte tillräckligt med betyg ännu")}
      </div>
    );
  }

  const avg = summary.avg;
  const stars = [0, 1, 2, 3, 4].map((i) => {
    const pct = Math.max(0, Math.min(1, avg - i)) * 100;
    return <PartialStar key={i} fillPct={pct} />;
  });

  return (
    <div
      className={`flex items-center gap-2 text-sm ${className ?? ""}`}
      aria-label={t("profile.rating_aria", {
        defaultValue: "{{avg}} av 5, baserat på {{count}} recensioner",
        avg: avg.toFixed(1),
        count: summary.count,
      })}
    >
      <span className="flex items-center gap-0.5">{stars}</span>
      <span className="font-medium text-foreground">{avg.toFixed(1)}</span>
      <span className="text-muted-foreground">
        ({t("profile.rating_reviews_count", {
          defaultValue: "{{count}} recensioner",
          count: summary.count,
        })})
      </span>
    </div>
  );
}
