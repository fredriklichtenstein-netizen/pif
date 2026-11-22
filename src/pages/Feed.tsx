import { OptimizedFeedContainer } from "@/components/feed/OptimizedFeedContainer";
import { MainNav } from "@/components/MainNav";
import { InstallInstructionsBanner } from "@/components/pwa/InstallInstructionsBanner";
import { LocationPermissionBanner } from "@/components/feed/LocationPermissionBanner";
import { HowItWorksBanner } from "@/components/home/HowItWorksBanner";

import { useEffect } from "react";
import { recentFeedScrollY, rememberFeedScroll } from "@/lib/feedScrollMemory";
import { FadeIn } from "@/components/animation/FadeIn";
import { useAnnouncement } from "@/hooks/accessibility/useAnnouncement";
import { useTranslation } from "react-i18next";

export default function Feed() {
  const { announce } = useAnnouncement();
  const { t } = useTranslation();

  useEffect(() => {
    announce(t('feed.announcement'));
  }, [announce, t]);

  // Back on the feed within a few minutes: return to the same spot instead of
  // the top (Trello #123). The feed hook reloads the same pages from cache;
  // we wait until they're tall enough, then scroll. A deep link (?post=) or
  // the drafts view decides its own position.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const target = params.has('post') || params.get('view') === 'drafts' ? null : recentFeedScrollY();
    let frame = 0;
    if (!target) {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    } else {
      const started = performance.now();
      const tryRestore = () => {
        const reachable = document.documentElement.scrollHeight - window.innerHeight;
        if (reachable >= target || performance.now() - started > 2500) {
          window.scrollTo({ top: Math.min(target, Math.max(0, reachable)), left: 0, behavior: 'auto' });
          return;
        }
        frame = requestAnimationFrame(tryRestore);
      };
      frame = requestAnimationFrame(tryRestore);
    }
    // Tracked while scrolling: by the time an unmount cleanup runs, the next
    // page has replaced the DOM and window.scrollY is already clamped.
    const onScroll = () => rememberFeedScroll(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <div className="min-h-screen-dvh bg-background">
      {/* Sticky logo header — white halo follows the logo's own shape */}
      <header className="sticky top-0 z-40 w-full flex justify-center pt-2 pb-2 pointer-events-none bg-transparent">
        <img
          src="/pif-logo-long.png"
          alt="Pay it Forward"
          className="h-10 w-auto object-contain pointer-events-auto"
        />
      </header>


      <main
        className="pb-20"
        role="main"
        aria-label={t('feed.announcement')}
      >
        {/* Trello backlog: feed stretched full viewport width on desktop,
            making post images huge and the feed hard to scan. Map is
            deliberately full-width elsewhere (it needs the space) but the
            feed doesn't need to be.

            First pass matched Messages.tsx's bare `container` class -- but
            Tailwind's `container` (tailwind.config.ts) only actually caps
            width at the 2xl breakpoint (1400px); below that it's full
            width, so this alone didn't meaningfully narrow the feed on a
            typical laptop screen. User clarified: ALL pages except Map
            should share the SAME narrower width already used by
            Profile/AccountSettings (max-w-3xl, 768px) -- app-wide sweep,
            see Messages/Home/ItemDetail/PostFormContainer/PostEdit/
            ProfileEdit/Privacy for the matching changes. */}
        <div className="max-w-3xl mx-auto px-4 pt-1">
          {/* Creating a pif/wish lives in MainNav's "+" -- the feed's own
              shortcut buttons were removed with the toolbar cleanup. */}
          <div className="flex justify-end mb-2">
            <HowItWorksBanner />
          </div>
          <InstallInstructionsBanner />
          <LocationPermissionBanner />
          <FadeIn>
            <OptimizedFeedContainer />
          </FadeIn>
        </div>
      </main>
      <MainNav />
    </div>
  );
}
