
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useEffect } from "react";
import { initializeAuth } from "@/hooks/useGlobalAuth";
import { NetworkStatusDebugger } from "@/components/debug/NetworkStatusDebugger";
import { publicRoutes, privateRoutes } from "./routes/routes";
import { GlobalDeleteDialog } from "./components/item/delete/GlobalDeleteDialog";

// Create a QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

function App() {
  useEffect(() => {
    // Initialize auth with error handling
    try {
      initializeAuth();
    } catch (error) {
      console.error('Failed to initialize auth:', error);
    }
    
    // Log application initialization for debugging
    console.log('App initialized with routes:', {
      publicRoutes: publicRoutes.map(r => r.path),
      privateRoutes: privateRoutes.map(r => r.path),
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <main>
          <Routes>
            {publicRoutes.map((route, index) => (
              <Route key={`public-${index}`} path={route.path} element={route.element} />
            ))}
            {privateRoutes.map((route, index) => (
              <Route key={`private-${index}`} path={route.path} element={route.element} />
            ))}
          </Routes>
        </main>
        <Toaster />
        <GlobalDeleteDialog />
        {process.env.NODE_ENV === 'development' && <NetworkStatusDebugger />}
      </Router>
    </QueryClientProvider>
  );
}

export default App;
