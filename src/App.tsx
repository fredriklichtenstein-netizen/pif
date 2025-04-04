
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainNav } from "./components/MainNav";
import { publicRoutes, privateRoutes } from "./routes/routes";
import { useEffect } from "react";
import { initializeAuth } from "./hooks/useGlobalAuth";

// Create a new QueryClient instance with better error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

const AppContent = () => {
  useEffect(() => {
    // Initialize global auth state
    let unsubscribe: (() => void) | undefined;
    
    try {
      // Initialize auth and get unsubscribe function
      initializeAuth()
        .then(sub => {
          if (sub && typeof sub.unsubscribe === 'function') {
            unsubscribe = sub.unsubscribe;
          }
        })
        .catch(error => {
          console.error("Error initializing auth:", error);
        });
    } catch (error) {
      console.error("Error initializing auth:", error);
    }
    
    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (error) {
          console.error("Error unsubscribing from auth:", error);
        }
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
