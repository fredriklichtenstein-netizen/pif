
import { PostForm } from "@/components/post/PostForm";
import { useMapbox } from "@/hooks/useMapbox";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

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

  return <PostForm />;
};

export default Post;
