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
        const { ITEM_PUBLIC_COLUMNS } = await import("@/services/items/publicColumns");
        const { data, error } = await supabase
          .from("items")
          .select(ITEM_PUBLIC_COLUMNS)
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

        // The item select above deliberately carries only public columns, so the
        // exact coordinate, address and pickup details are not on `data`. As the
        // owner, fetch them through the authorised RPC — the only route the
        // database permits — and merge them back for the edit form.
        // usePostFormState expects coordinates as { x: lng, y: lat }.
        const { fetchItemPrivateLocation } = await import("@/services/items/privateLocation");
        const priv = await fetchItemPrivateLocation(parseInt(id, 10));

        let normalizedCoordinates: { x: number; y: number } | null = null;
        if (priv?.coordinates) {
          normalizedCoordinates = { x: priv.coordinates.lng, y: priv.coordinates.lat };
        }

        setItem({
          ...data,
          location: priv?.location ?? (data as any).location_public ?? "",
          pickup_address: priv?.pickupAddress ?? "",
          pickup_door_code: priv?.pickupDoorCode ?? "",
          pickup_floor: priv?.pickupFloor ?? "",
          pickup_instructions: priv?.pickupInstructions ?? "",
          phone: priv?.phone ?? "",
          coordinates: normalizedCoordinates,
        });
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
