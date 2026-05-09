
import { useState, useEffect } from "react";
import { MapContainer } from "@/components/map/MapContainer";
import { MainHeader } from "@/components/layout/MainHeader";
import { Separator } from "@/components/ui/separator";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useFeedPosts } from "@/hooks/useFeedPosts";
import { FadeIn } from "@/components/animation/FadeIn";
import { SlideIn } from "@/components/animation/SlideIn";
import { useAnnouncement } from "@/hooks/accessibility/useAnnouncement";
import { useMapbox } from "@/hooks/useMapbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, AlertCircle, MapPin, ExternalLink } from "lucide-react";
import { DEMO_MODE } from "@/config/demoMode";
import { useTranslation } from "react-i18next";
import { MainNav } from "@/components/MainNav";
import { PullToRefresh } from "@/components/common/PullToRefresh";
import { RefreshOverlay } from "@/components/common/RefreshOverlay";
import { useSharedRefresh } from "@/hooks/useSharedRefresh";

export default function Map() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { announce } = useAnnouncement();
  const { posts, isLoading, refreshPosts } = useFeedPosts();
  const [targetItemId, setTargetItemId] = useState<string | null>(null);
  // Single shared refresh action — same hook used by the feed.
  const { refresh: handleRefresh, isRefreshing } = useSharedRefresh(refreshPosts);
  const { mapToken, isLoading: isTokenLoading, error: tokenError, retryFetchToken, needsToken, setDemoToken } = useMapbox();
  const [tokenInput, setTokenInput] = useState("");
  const { t } = useTranslation();
  useEffect(() => {
    const itemId = searchParams.get('item');
    if (itemId) {
      setTargetItemId(itemId);
    } else {
      setTargetItemId(null);
    }
  }, [searchParams]);

  useEffect(() => {
    announce(t('map.map_loaded_announcement'));
    refreshPosts();
  }, [announce, refreshPosts, t]);

  const handlePostClick = (postId: string) => {
    navigate(`/feed?post=${postId}&t=${Date.now()}`);
  };

  const handleTokenSubmit = () => {
    if (tokenInput.trim().startsWith('pk.')) {
      setDemoToken(tokenInput.trim());
    }
  };

  if (isTokenLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MainHeader />
        <Separator />
        <main className="relative h-[calc(100vh-73px)] flex items-center justify-center" role="main" aria-label={t('map.loading_map_credentials')}>
          <div className="text-center p-6">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground font-medium">{t('map.loading_map_credentials')}</p>
          </div>
        </main>
      </div>
    );
  }

  if (DEMO_MODE && needsToken) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MainHeader />
        <Separator />
        <main className="relative h-[calc(100vh-73px)] flex items-center justify-center" role="main" aria-label={t('map.map_requires_token')}>
          <div className="text-center p-6 max-w-md">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">{t('map.map_requires_token')}</h2>
            <p className="text-muted-foreground mb-4 text-sm">{t('map.map_token_description')}</p>
            <div className="space-y-3">
              <Input
                type="text"
                placeholder="pk.eyJ1..."
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="text-sm"
              />
              <Button 
                onClick={handleTokenSubmit}
                disabled={!tokenInput.startsWith('pk.')}
                className="w-full"
              >
                {t('map.use_token')}
              </Button>
              <a 
                href="https://account.mapbox.com/access-tokens/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                {t('map.get_free_token')} <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-xs text-amber-800">
                <strong>{t('map.demo_mode')}:</strong> {t('map.demo_token_note')}
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (tokenError || !mapToken) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MainHeader />
        <Separator />
        <main className="relative h-[calc(100vh-73px)] flex items-center justify-center" role="main" aria-label={t('map.map_unavailable')}>
          <div className="text-center p-6 max-w-md">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">{t('map.map_unavailable')}</h2>
            <p className="text-muted-foreground mb-4">
              {t('map.unable_to_load')}
            </p>
            <Button 
              onClick={retryFetchToken} 
              className="flex items-center gap-2"
              variant="default"
            >
              <RefreshCw className="h-4 w-4" /> 
              {t('map.retry')}
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MainHeader />
      <Separator />
      <PullToRefresh
        onRefresh={handleRefresh}
        disabled={isLoading || isRefreshing}
        ignoreSelector=".mapboxgl-map"
      >
        <main className="relative h-[calc(100vh-73px)]" role="main" aria-label={t('map.interactive_map')}>
          <FadeIn className="h-full">
            {/* `inert` blocks pointer + keyboard + focus on every
                descendant — including MapFilters, the distance slider
                and the "my location" control — so users can't change
                the map state while a refresh is in flight. */}
            <div
              className="absolute inset-0 z-0"
              aria-busy={isRefreshing}
              {...(isRefreshing ? { inert: "" as unknown as boolean } : {})}
            >
              <SlideIn direction="up" className="h-full">
                <MapContainer
                  mapboxToken={mapToken}
                  posts={posts}
                  onPostClick={handlePostClick}
                  targetItemId={targetItemId}
                />
              </SlideIn>
            </div>
          </FadeIn>

          {DEMO_MODE && (
            <div className="absolute top-4 left-4 right-4 z-50 pointer-events-none flex justify-center">
              <div className="bg-amber-50/95 backdrop-blur-sm border border-amber-200 rounded-lg px-4 py-2 shadow-lg pointer-events-auto">
                <p className="text-xs text-amber-800 text-center">
                  <strong>{t('map.demo_mode')}</strong> — {t('map.demo_viewing')}
                </p>
              </div>
            </div>
          )}

          {/* Translucent veil over the map while refreshing so the
              stale data is visibly de-emphasised but still in place.
              Click handler informs the user why filters/markers are
              unresponsive — sonner dedupes via the stable `id`. */}
          {isRefreshing && (
            <div
              className="absolute inset-0 z-40 bg-background/30 backdrop-blur-[1px] cursor-wait transition-opacity"
              onClick={() =>
                toast.message(t('interactions.filters_disabled_during_refresh'), {
                  id: 'refresh-filters-disabled',
                  duration: 1800,
                })
              }
              aria-hidden="true"
            />
          )}

          <RefreshOverlay
            show={isRefreshing || isLoading}
            label={isRefreshing ? t('interactions.refreshing_feed') : t('map.loading_posts')}
            className="!fixed"
          />
        </main>
      </PullToRefresh>
      <MainNav />
    </div>
  );
}
