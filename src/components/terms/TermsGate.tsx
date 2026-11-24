import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/hooks/auth/authStore";
import { useTermsStore } from "@/stores/termsStore";
import { flashToast } from "@/lib/flashToast";
import { TERMS_SCREEN_EXEMPT_PATHS, TERMS_VERSION } from "@/lib/terms";

/**
 * Terms of use acceptance (Trello "Användarvillkor", decided 2026-11-22).
 *
 * Looks up whether the signed-in person has accepted TERMS_VERSION. If not,
 * shows a one-time screen ("Jag godkänner" / "Inte nu") once per session.
 * After "Inte nu" they can browse, but ensureTermsAccepted() brings the screen
 * back when they try to post, show interest, comment or send a message.
 * New accounts accept on "Skapa profil", so they never see this screen.
 */
export function TermsGate() {
  const { t } = useTranslation();
  const location = useLocation();
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const profileCompleted = useAuthStore((s) => s.profileCompleted);
  const status = useTermsStore((s) => s.status);
  const screenOpen = useTermsStore((s) => s.screenOpen);
  const setStatus = useTermsStore((s) => s.setStatus);
  const openScreen = useTermsStore((s) => s.openScreen);
  const closeScreen = useTermsStore((s) => s.closeScreen);
  const [saving, setSaving] = useState(false);
  const autoShownFor = useRef<string | null>(null);

  // Load the acceptance once per signed-in, onboarded person.
  useEffect(() => {
    if (!userId || profileCompleted !== true) {
      setStatus("unknown");
      return;
    }
    let cancelled = false;
    void (async () => {
      const { data, error } = await (supabase.rpc as any)("get_my_terms_acceptance");
      if (cancelled || error) return; // stays "unknown": never block on a failed lookup
      const row = Array.isArray(data) ? data[0] : data;
      setStatus(row?.terms_version === TERMS_VERSION ? "accepted" : "required");
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, profileCompleted, setStatus]);

  const exempt = TERMS_SCREEN_EXEMPT_PATHS.some(
    (p) => location.pathname === p || location.pathname.startsWith(`${p}/`),
  );

  // Show it by itself once per session (per person), not on the terms page etc.
  useEffect(() => {
    if (status !== "required" || exempt || !userId) return;
    if (autoShownFor.current === userId) return;
    autoShownFor.current = userId;
    openScreen();
  }, [status, exempt, userId, openScreen]);

  const accept = async () => {
    setSaving(true);
    try {
      const { data, error } = await (supabase.rpc as any)("accept_terms", { p_version: TERMS_VERSION });
      if (error || data !== true) throw error ?? new Error("not saved");
      setStatus("accepted");
    } catch (err) {
      console.error("[TermsGate] accept_terms failed", err);
      flashToast("error", t("terms.gate_accept_failed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AlertDialog
      open={screenOpen && status === "required" && !exempt}
      onOpenChange={(open) => {
        if (!open && !saving) closeScreen();
      }}
    >
      <AlertDialogContent
        onCloseAutoFocus={(e) => {
          // Same as the block dialog: no trigger to return focus to, and lift
          // the body pointer-events lock Radix can leave behind.
          e.preventDefault();
          setTimeout(() => {
            if (!document.querySelector('[role="dialog"][data-state="open"]')) {
              document.body.style.pointerEvents = "";
            }
          }, 0);
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>{t("terms.gate_title")}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>{t("terms.gate_body")}</p>
              <p>
                <Link to="/villkor" className="text-primary underline" onClick={() => closeScreen()}>
                  {t("terms.gate_read")}
                </Link>
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <Button variant="outline" onClick={() => closeScreen()} disabled={saving}>
            {t("terms.gate_later")}
          </Button>
          <Button onClick={accept} disabled={saving}>
            {t("terms.gate_accept")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
