import { OptimizedFeedContainer } from "@/components/feed/OptimizedFeedContainer";
import { MainNav } from "@/components/MainNav";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

import { useEffect } from "react";
import { FadeIn } from "@/components/animation/FadeIn";
import { useAnnouncement } from "@/hooks/accessibility/useAnnouncement";
import { useTranslation } from "react-i18next";

export default function Feed() {
  const { announce } = useAnnouncement();
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    announce(t('feed.announcement'));
  }, [announce, t]);

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky logo header — white gradient fade so logo pops on any background */}
      <header
        className="sticky top-0 z-40 w-full flex justify-center pt-2 pb-3 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, rgba(255,255,255,0.95) 60%, rgba(255,255,255,0))",
        }}
      >
        <img
          src="/pif-logo-long.png"
          alt="Pay it Forward"
          className="h-10 w-auto object-contain pointer-events-auto"
        />
      </header>


      <main
        className="pb-28"
        role="main"
        aria-label={t('feed.announcement')}
      >
        <div className="max-w-2xl mx-auto pt-1">
          {/* Compact action bar */}
          <div className="grid grid-cols-2 gap-2 mb-3 px-2">
            <Button
              type="button"
              onClick={() => navigate("/post?type=offer")}
              className="bg-pif-offer text-pif-offer-foreground hover:bg-pif-offer/90 h-9 px-2 text-sm font-medium"
              aria-label={t('interactions.add_pif_button')}
            >
              + {t('interactions.add_pif_short')} 🎁
            </Button>
            <Button
              type="button"
              onClick={() => navigate("/post?type=request")}
              className="bg-pif-wish text-pif-wish-foreground hover:bg-pif-wish/90 h-9 px-2 text-sm font-medium"
              aria-label={t('interactions.add_wish_button')}
            >
              + {t('interactions.add_wish_short')} ✨
            </Button>
          </div>

          <FadeIn>
            <OptimizedFeedContainer />
          </FadeIn>
        </div>
      </main>
      <MainNav />
    </div>
  );
}
