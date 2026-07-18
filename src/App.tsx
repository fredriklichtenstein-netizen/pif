
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { useEffect } from "react";

import { Routes } from "./routes/Routes";
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import { NetworkStatusWrapper } from "@/components/common/NetworkStatusWrapper";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";
import { SkipToContent } from "@/components/accessibility/SkipToContent";

import { OfflineIndicator } from "@/components/pwa/OfflineIndicator";
import { ReceiverConfirmationWatcher } from "@/components/profile/completion/ReceiverConfirmationWatcher";
import { FeedbackFab } from "@/components/feedback/FeedbackFab";
import { isAuthInvalidError, isAuthRequestCircuitOpen } from "@/hooks/auth/sessionRecovery";
import { initializeAuth } from "@/hooks/useGlobalAuth";
import { useVersionCheck } from "@/hooks/useVersionCheck";
import { useCityBackfill } from "@/hooks/profile/useCityBackfill";
import { startBootSafetyFuse } from "@/utils/bootSafetyFuse";
import { AuthHydrationDebugPanel } from "@/components/debug/AuthHydrationDebugPanel";
import { StagingBadge } from "@/components/debug/StagingBadge";
import { debugLog } from "@/utils/authDebug";
import "./App.css";

debugLog("boot", "module import: App.tsx");

// Kick the boot safety fuse the instant the module is imported, before any
// React rendering, so even a synchronous freeze in App() can't block it.
startBootSafetyFuse();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: (failureCount, error) => {
        if (isAuthRequestCircuitOpen() || isAuthInvalidError(error)) {
          return false;
        }
        // Don't retry on 4xx errors
        if (error && typeof error === 'object' && 'status' in error) {
          const status = error.status as number;
          if (status >= 400 && status < 500) {
            return false;
          }
        }
        return failureCount < 3;
      },
    },
  },
});

function App() {
  useEffect(() => {
    debugLog("auth", "App mounted, calling initializeAuth()");
    void initializeAuth().then(() => debugLog("auth", "initializeAuth() resolved"));
  }, []);

  useVersionCheck();
  useCityBackfill();



  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <TooltipProvider>
            <BrowserRouter>
              <SkipToContent />
              <OfflineIndicator />
              <NetworkStatusWrapper>
                <main id="main-content" role="main">
                  <Routes />
                </main>
              </NetworkStatusWrapper>
              <ReceiverConfirmationWatcher />
              <FeedbackFab />
              <Toaster />
              <Sonner />
              <AuthHydrationDebugPanel />
              <StagingBadge />
            </BrowserRouter>
          </TooltipProvider>
        </I18nextProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
