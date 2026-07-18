import { IS_STAGING } from "@/integrations/supabase/client";

/** Small always-visible indicator so a staging build is never mistaken for production. */
export function StagingBadge() {
  if (!IS_STAGING) return null;

  return (
    <div
      className="fixed bottom-2 left-2 z-50 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow pointer-events-none"
      aria-hidden="true"
    >
      STAGING
    </div>
  );
}
