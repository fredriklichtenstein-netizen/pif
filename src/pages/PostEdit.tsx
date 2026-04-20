import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Loader2 } from "lucide-react";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import PostForm from "@/components/post/PostForm";
import { MainNav } from "@/components/MainNav";
import { MainHeader } from "@/components/layout/MainHeader";
import { useTranslation } from "react-i18next";

function PostEdit() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useGlobalAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

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

        // PostGIS returns coordinates as a string like "(lng,lat)".
        // usePostFormState expects an object with .x (lng) and .y (lat),
        // so normalize here so the edit form pre-fills correctly.
        let normalizedCoordinates: { x: number; y: number } | null = null;
        const rawCoords = (data as any).coordinates;
        if (typeof rawCoords === "string") {
          const match = rawCoords.match(/^\(?\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)?$/);
          if (match) {
            normalizedCoordinates = { x: parseFloat(match[1]), y: parseFloat(match[2]) };
          }
        } else if (rawCoords && typeof rawCoords === "object") {
          if ("x" in rawCoords && "y" in rawCoords) {
            normalizedCoordinates = { x: Number(rawCoords.x), y: Number(rawCoords.y) };
          } else if ("lng" in rawCoords && "lat" in rawCoords) {
            normalizedCoordinates = { x: Number(rawCoords.lng), y: Number(rawCoords.lat) };
          }
        }

        setItem({ ...data, coordinates: normalizedCoordinates });
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
      <div className="min-h-screen flex flex-col">
        <MainHeader />
        <div className="container max-w-2xl mx-auto py-8 px-4 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <MainHeader />
        <div className="container max-w-2xl mx-auto py-8 px-4">
          <Card className="p-8 flex flex-col items-center">
            <AlertCircle className="text-destructive h-10 w-10 mb-4" />
            <h2 className="text-xl font-semibold mb-2">{t('common.error')}</h2>
            <p className="text-muted-foreground">{error}</p>
          </Card>
        </div>
        <MainNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <MainHeader />
      <div className="container max-w-2xl mx-auto py-8 px-4 pb-20">
        <h1 className="text-2xl font-bold mb-6">{t('profile.edit_pif')}</h1>
        <PostForm initialData={item} />
      </div>
      <MainNav />
    </div>
  );
}

export default PostEdit;
