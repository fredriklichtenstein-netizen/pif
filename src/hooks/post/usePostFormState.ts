
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import type { PostFormData } from "@/types/post";
import { supabase } from "@/integrations/supabase/client";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";

export function usePostFormState(initialData?: any) {
  const [searchParams] = useSearchParams();
  // Allow Feed buttons / deep links to preselect the post type via ?type=offer | ?type=request.
  const queryType = searchParams.get("type");
  const initialItemType: "offer" | "request" =
    initialData?.item_type ??
    (queryType === "request" || queryType === "offer" ? queryType : "offer");

  const [formData, setFormData] = useState<PostFormData>({
    title: initialData?.title || "",
    description: initialData?.description || "",
    category: initialData?.category || "",
    condition: initialData?.condition || "",
    item_type: initialItemType,
    coordinates: initialData?.coordinates ? {
      lat: typeof initialData.coordinates === 'object' && initialData.coordinates !== null ?
           (initialData.coordinates as any).y : null,
      lng: typeof initialData.coordinates === 'object' && initialData.coordinates !== null ?
           (initialData.coordinates as any).x : null
    } : null,
    location: initialData?.location || "",
    images: initialData?.images || [],
    measurements: initialData?.measurements || {},
    pickup_preference: initialData?.pickup_preference || "",
    pickup_door_code: initialData?.pickup_door_code || "",
    pickup_floor: initialData?.pickup_floor != null ? String(initialData.pickup_floor) : "",
    pickup_instructions: initialData?.pickup_instructions || "",
    preferred_time_window: initialData?.preferred_time_window || "",
    pickup_address: initialData?.pickup_address || "",
    pickup_address_mode: initialData?.pickup_address_mode || "primary",
    primary_address: initialData?.primary_address || "",
  });

  // Prefill pickup_preference (and pickup address) from the user's profile
  // default — only for new posts. Re-runs once auth is ready so we don't
  // race a not-yet-hydrated session on hard refresh.
  const { user: authUser } = useGlobalAuth();
  useEffect(() => {
    if (initialData?.id) return;
    if (!authUser?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('pickup_preference, address, pickup_address')
          .eq('id', authUser.id)
          .single();
        if (cancelled || !data) return;
        const pref = (data as any)?.pickup_preference;
        const primary = (data as any)?.address || "";
        const savedPickup = (data as any)?.pickup_address || "";
        setFormData((prev) => {
          const next = { ...prev };
          if (pref && !prev.pickup_preference) next.pickup_preference = pref;
          if (!prev.primary_address) next.primary_address = primary;
          // Default the post's pickup_address to the user's saved preference
          if (!prev.pickup_address) {
            next.pickup_address = savedPickup || primary;
            next.pickup_address_mode = savedPickup && savedPickup !== primary ? 'custom' : 'primary';
          }
          return next;
        });
      } catch {
        // ignore
      }
    })();
    return () => { cancelled = true; };
  }, [initialData?.id, authUser?.id]);


  const handleImagesChange = (images: string[]) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      images: images,
    }));
  };

  const handleMeasurementChange = (name: string, value: string) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      measurements: {
        ...prevFormData.measurements,
        [name]: value,
      },
    }));
  };

  return {
    formData,
    setFormData,
    handleImagesChange,
    handleMeasurementChange,
  };
}
