import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { useEffect, lazy, Suspense } from "react";
import { initializeAuth } from "@/hooks/useGlobalAuth";
import { NetworkStatusDebugger } from "@/components/debug/NetworkStatusDebugger";

import Home from "@/pages/Home";
import Feed from "@/pages/Feed";
import Map from "@/pages/Map";
import Post from "@/pages/Post";
import Auth from "@/pages/Auth";
import Profile from "@/pages/Profile";
import Messages from "@/pages/Messages";
import NotFound from "@/pages/NotFound";
import PublicProfile from "@/pages/PublicProfile";
import AccountSettings from "@/pages/AccountSettings";

const Conversation = lazy(() => import("@/pages/Conversation"));
const EditProfile = lazy(() => import("@/pages/ProfileEdit"));
const PostEdit = lazy(() => import("@/pages/PostEdit"));
const ItemDetail = lazy(() => import("@/pages/ItemDetail"));

const PageLoading = () => (
  <div className="flex justify-center items-center h-[60vh]">
    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
  </div>
);

function App() {
  useEffect(() => {
    initializeAuth();
  }, []);

  return (
    <Router>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/feed" element={<Feed />} />
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
          <Route path="/user/:id" element={<PublicProfile />} />
          <Route
            path="/item/:id"
            element={
              <Suspense fallback={<PageLoading />}>
                <ItemDetail />
              </Suspense>
            }
          />
          <Route path="/post/edit/:id" 
            element={
              <Suspense fallback={<PageLoading />}>
                <PostEdit />
              </Suspense>
            } 
          />
          <Route 
            path="/profile/edit" 
            element={
              <Suspense fallback={<PageLoading />}>
                <EditProfile />
              </Suspense>
            } 
          />
          <Route path="/account-settings" element={<AccountSettings />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Toaster />
      {process.env.NODE_ENV === 'development' && <NetworkStatusDebugger />}
    </Router>
  );
}

export default App;
