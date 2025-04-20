
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { useEffect, lazy, Suspense } from "react";
import { initializeAuth } from "@/hooks/useGlobalAuth";
import { MainHeader } from "@/components/layout/MainHeader";
import { NetworkStatusDebugger } from "@/components/debug/NetworkStatusDebugger";

// Import your pages here
import Index from "@/pages/Index";
import Map from "@/pages/Map";
import Post from "@/pages/Post";
import Auth from "@/pages/Auth";
import Profile from "@/pages/Profile";
import Messages from "@/pages/Messages";
import NotFound from "@/pages/NotFound";

// Lazy load the Conversation page
const Conversation = lazy(() => import("@/pages/Conversation"));

// Simple loading component for lazy-loaded routes
const PageLoading = () => (
  <div className="flex justify-center items-center h-[60vh]">
    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
  </div>
);

function App() {
  // Initialize auth on app load
  useEffect(() => {
    initializeAuth();
  }, []);

  return (
    <Router>
      <MainHeader />
      <main>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/map" element={<Map />} />
          <Route path="/post" element={<Post />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/messages" element={<Messages />} />
          <Route 
            path="/conversation/:id" 
            element={
              <Suspense fallback={<PageLoading />}>
                <Conversation />
              </Suspense>
            } 
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Toaster />
      
      {/* Add the Network Debugger in development mode */}
      {process.env.NODE_ENV === 'development' && <NetworkStatusDebugger />}
    </Router>
  );
}

export default App;
