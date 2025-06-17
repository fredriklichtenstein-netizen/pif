
import React, { Suspense } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { MainNav } from "@/components/MainNav";
import { MainHeader } from "@/components/layout/MainHeader";

// Lazy load the PostForm component
const PostForm = React.lazy(() => import("@/components/post/PostForm"));

const Post = () => {
  const { session, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Redirect to auth page if not logged in
  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <MainHeader />
      <div className="flex-1">
        <Suspense fallback={
          <div className="container mx-auto px-4 pt-4">
            <Skeleton className="h-[70vh] w-full rounded-lg" />
          </div>
        }>
          <PostForm />
        </Suspense>
      </div>
      <MainNav />
    </div>
  );
};

export default Post;
