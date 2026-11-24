import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Capacitor } from "@capacitor/core";
import { Button } from "@/components/ui/button";
import { onAppResume } from "@/lib/onAppResume";
import { checkUpdateRequired, STORE_URLS } from "@/native/minVersion";

/**
 * Mounted once in App. In the native apps it checks the minimum version at
 * launch and whenever the app comes back, and covers the whole app with an
 * "Uppdatering krävs" screen when this build is too old. Inert on the web.
 */
export function UpdateRequiredGate() {
  const { t } = useTranslation();
  const [required, setRequired] = useState(false);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let cancelled = false;
    const check = () => {
      void checkUpdateRequired().then((r) => {
        if (!cancelled) setRequired(r);
      });
    };
    check();
    const off = onAppResume(check, 5_000);
    return () => {
      cancelled = true;
      off();
    };
  }, []);

  if (!required) return null;

  const platform = Capacitor.getPlatform() === "android" ? "android" : "ios";
  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="update-required-title"
      className="fixed inset-0 z-[1000] flex flex-col items-center justify-center gap-4 bg-background px-6 text-center"
      style={{
        paddingTop: "max(1.5rem, env(safe-area-inset-top))",
        paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
      }}
    >
      <img src="/icons/icon-192.png" alt="" className="h-20 w-20 rounded-2xl" />
      <h1 id="update-required-title" className="text-2xl font-semibold">
        {t("update_required.title")}
      </h1>
      <p className="max-w-sm text-muted-foreground">{t("update_required.body")}</p>
      <Button size="lg" className="mt-2" onClick={() => window.open(STORE_URLS[platform], "_blank")}>
        {t(platform === "android" ? "update_required.button_android" : "update_required.button_ios")}
      </Button>
    </div>
  );
}
