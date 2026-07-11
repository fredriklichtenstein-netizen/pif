import { useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Download, MoreVertical, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { isAndroid, isDesktopChromium, isIOS, isMobile, isStandalone } from "@/utils/pwa/platform";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pif.installBanner.dismissed";

export function InstallInstructionsBanner() {
  const { t } = useTranslation();
  const { user } = useGlobalAuth();

  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    try {
      return window.sessionStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  // Only visible for authenticated users on mobile, not already installed, not dismissed.
  if (!user) return null;
  if (dismissed) return null;
  if (isStandalone()) return null;
  if (!isMobile()) return null;

  const ios = isIOS();
  const android = isAndroid();
  // If it's neither iOS nor Android but still mobile (rare), skip — no reliable copy.
  if (!ios && !android) return null;

  const handleDismiss = () => {
    try {
      window.sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Ignore storage failures — banner will just reappear next mount.
    }
    setDismissed(true);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    } finally {
      setDeferredPrompt(null);
      handleDismiss();
    }
  };

  return (
    <div
      className="mx-2 mb-3 rounded-lg border border-primary/20 bg-primary/10 p-3 text-sm text-foreground"
      role="region"
      aria-label={t("interactions.install_banner_title")}
    >
      <div className="flex items-start gap-3">
        <Download className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-medium">{t("interactions.install_banner_title")}</p>

          {ios && (
            <p className="text-muted-foreground">
              <Trans
                i18nKey="interactions.install_banner_ios_instructions"
                components={{
                  shareIcon: (
                    <Share
                      className="inline-block h-4 w-4 align-text-bottom text-primary"
                      aria-label={t("interactions.install_banner_ios_share_aria")}
                    />
                  ),
                }}
              />
            </p>
          )}

          {android && !deferredPrompt && (
            <p className="text-muted-foreground">
              <Trans
                i18nKey="interactions.install_banner_android_instructions"
                components={{
                  menuIcon: (
                    <MoreVertical
                      className="inline-block h-4 w-4 align-text-bottom text-primary"
                      aria-label={t("interactions.install_banner_android_menu_aria")}
                    />
                  ),
                }}
              />
            </p>
          )}

          {android && deferredPrompt && (
            <div className="pt-1">
              <Button size="sm" onClick={handleInstall}>
                {t("interactions.install_banner_install_cta")}
              </Button>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={handleDismiss}
          aria-label={t("interactions.install_banner_dismiss_aria")}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
