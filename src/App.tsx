
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { useEffect } from "react";
import { initializeAuth } from "@/hooks/useGlobalAuth";
import { NetworkStatusDebugger } from "@/components/debug/NetworkStatusDebugger";
import { publicRoutes, privateRoutes } from "./routes/routes";

function App() {
  useEffect(() => {
    initializeAuth();
    
    // Log application initialization for debugging
    console.log('App initialized with routes:', {
      publicRoutes: publicRoutes.map(r => r.path),
      privateRoutes: privateRoutes.map(r => r.path),
    });
  }, []);

  return (
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
      {process.env.NODE_ENV === 'development' && <NetworkStatusDebugger />}
    </Router>
  );
}

export default App;
