
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { Routes } from "./routes/Routes";
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import { NetworkStatusWrapper } from "@/components/common/NetworkStatusWrapper";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";
import { SkipToContent } from "@/components/accessibility/SkipToContent";
import { PWAInstallPrompt } from "@/components/pwa/PWAInstallPrompt";
import { OfflineIndicator } from "@/components/pwa/OfflineIndicator";
import "./App.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: (failureCount, error) => {
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
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <TooltipProvider>
            <BrowserRouter>
              <SkipToContent />
              <OfflineIndicator />
              <PWAInstallPrompt />
              <NetworkStatusWrapper>
                <main id="main-content" role="main">
                  <Routes />
                </main>
              </NetworkStatusWrapper>
              <Toaster />
              <Sonner />
            </BrowserRouter>
          </TooltipProvider>
        </I18nextProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
