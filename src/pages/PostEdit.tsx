import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Loader2 } from "lucide-react";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import PostForm from "@/components/post/PostForm";
import { MainNav } from "@/components/MainNav";

function PostEdit() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useGlobalAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) {
      setError("No item ID provided");
      setLoading(false);
      return;
    }

    const fetchItem = async () => {
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data, error } = await supabase
          .from("items")
          .select("*")
          .eq("id", parseInt(id, 10))
          .single();

        if (error) {
          throw error;
        }

        if (!data) {
          throw new Error("Item not found");
        }

        if (user?.id !== data.user_id) {
          throw new Error("You don't have permission to edit this item");
        }

        setItem(data);
      } catch (err: any) {
        console.error("Error fetching item:", err);
        setError(err.message || "Failed to load item");
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id, user]);

  if (loading) {
    return (
      <div className="container max-w-2xl mx-auto py-8 px-4 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <Card className="p-8 flex flex-col items-center">
          <AlertCircle className="text-destructive h-10 w-10 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="container max-w-2xl mx-auto py-8 px-4 pb-20">
        <h1 className="text-2xl font-bold mb-6">Edit PIF</h1>
        <PostForm initialData={item} />
      </div>
      <MainNav />
    </>
  );
}

export default PostEdit;
