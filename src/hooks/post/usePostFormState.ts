
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import type { PostFormData } from "@/types/post";
import { supabase } from "@/integrations/supabase/client";

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
    pickup_instructions: initialData?.pickup_instructions || "",
    preferred_time_window: initialData?.preferred_time_window || "",
    pickup_address: initialData?.pickup_address || "",
    pickup_address_mode: initialData?.pickup_address_mode || "primary",
    primary_address: initialData?.primary_address || "",
  });

  // Prefill pickup_preference from user's profile default (only for new posts)
  useEffect(() => {
    if (initialData?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) return;
        const { data } = await supabase
          .from('profiles')
          .select('pickup_preference, address, pickup_address')
          .eq('id', user.id)
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
  }, [initialData?.id]);

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
