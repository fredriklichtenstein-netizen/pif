
import { OptimizedFeedContainer } from "@/components/feed/OptimizedFeedContainer";
import { MainHeader } from "@/components/layout/MainHeader";
import { Separator } from "@/components/ui/separator";
import { MainNav } from "@/components/MainNav";

import { useEffect } from "react";
import { FadeIn } from "@/components/animation/FadeIn";
import { SlideIn } from "@/components/animation/SlideIn";
import { useAnnouncement } from "@/hooks/accessibility/useAnnouncement";
import { useTranslation } from "react-i18next";

export default function Feed() {
  const { announce } = useAnnouncement();
  const { t } = useTranslation();

  useEffect(() => {
    announce(t('feed.announcement'));
  }, [announce, t]);

  return (
    <div className="min-h-screen bg-gray-50">
      <MainHeader />
      <Separator />
      
      <main className="container mx-auto px-4 py-6" role="main" aria-label={t('feed.announcement')}>
        <div className="max-w-2xl mx-auto">
          <FadeIn>
            <header className="mb-6">
              <SlideIn direction="down">
                <h1 className="text-2xl font-bold text-foreground mb-2">{t('feed.title')}</h1>
              </SlideIn>
              <SlideIn direction="down" delay={100}>
                <p className="text-muted-foreground">{t('feed.subtitle')}</p>
              </SlideIn>
            </header>
          </FadeIn>
          
          <SlideIn direction="up" delay={200}>
            <OptimizedFeedContainer />
          </SlideIn>
        </div>
      </main>
    </div>
  );
}
