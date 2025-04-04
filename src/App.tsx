
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainNav } from "./components/MainNav";
import { publicRoutes, privateRoutes } from "./routes/routes";
import { useEffect } from "react";
import { initializeAuth } from "./hooks/useGlobalAuth";

const queryClient = new QueryClient();

const AppContent = () => {
  useEffect(() => {
    // Initialize global auth state
    let cleanupSubscription: Promise<{ unsubscribe: () => void }> | undefined;
    
    try {
      cleanupSubscription = initializeAuth();
    } catch (error) {
      console.error("Error initializing auth:", error);
    }
    
    // Cleanup subscription
    return () => {
      if (cleanupSubscription) {
        cleanupSubscription
          .then(sub => {
            if (sub && typeof sub.unsubscribe === 'function') {
              sub.unsubscribe();
            }
          })
          .catch(error => {
            console.error("Error unsubscribing from auth:", error);
          });
      }
    };
  }, []);

  return (
    <>
      <Routes>
        {publicRoutes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}
        {privateRoutes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}
      </Routes>
      <MainNav />
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
