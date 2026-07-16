
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import type { PostFormData, PickupProfileDefaults } from "@/types/post";
import { supabase } from "@/integrations/supabase/client";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";

const EMPTY_DEFAULTS: PickupProfileDefaults = {
  pickup_address: "",
  pickup_door_code: "",
  pickup_floor: "",
  pickup_instructions: "",
  phone: "",
  primary_address: "",
  pickup_preference: "",
};

export function usePostFormState(initialData?: any) {
  const [searchParams] = useSearchParams();
  // Allow Feed buttons / deep links to preselect the post type via ?type=offer | ?type=request.
  const queryType = searchParams.get("type");
  const initialItemType: "offer" | "request" =
    initialData?.item_type ??
    (queryType === "request" || queryType === "offer" ? queryType : "offer");

  // Note: title/description/category/condition/images and other non-PII fields
  // continue to hydrate from `initialData` (edit-mode pre-fill). Pickup PII
  // fields (pickup_address, pickup_door_code, pickup_floor, pickup_instructions,
  // phone) also still hydrate from `initialData` here — that's necessary so
  // editing an existing pif preserves what was previously saved on the item.
  // What we DO NOT do (any more) is auto-populate these PII fields from the
  // user's PROFILE on new posts — that behavior is removed below, replaced by
  // the opt-in per-field toggle UI in PostFormLocation.
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
    imageCrops: initialData?.image_crops || [],
    measurements: initialData?.measurements || {},
    pickup_preference: initialData?.pickup_preference || "",
    pickup_door_code: initialData?.pickup_door_code || "",
    pickup_floor: initialData?.pickup_floor != null ? String(initialData.pickup_floor) : "",
    pickup_instructions: initialData?.pickup_instructions || "",
    preferred_time_window: initialData?.preferred_time_window || "",
    pickup_address: initialData?.pickup_address || "",
    pickup_address_mode: initialData?.pickup_address_mode || "primary",
    primary_address: initialData?.primary_address || "",
    phone: initialData?.phone || "",
  });

  const [profileDefaults, setProfileDefaults] = useState<PickupProfileDefaults>(EMPTY_DEFAULTS);

  const { user: authUser } = useGlobalAuth();
  useEffect(() => {
    if (!authUser?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('pickup_preference, address, pickup_address, pickup_door_code, pickup_floor, pickup_instructions, phone')
          .eq('id', authUser.id)
          .single();
        if (cancelled || !data) return;
        const d = data as any;
        const primary = d?.address || "";
        const defaults: PickupProfileDefaults = {
          pickup_address: d?.pickup_address || "",
          pickup_door_code: d?.pickup_door_code || "",
          pickup_floor: d?.pickup_floor != null ? String(d.pickup_floor) : "",
          pickup_instructions: d?.pickup_instructions || "",
          phone: d?.phone || "",
          primary_address: primary,
          pickup_preference: d?.pickup_preference || "",
        };
        setProfileDefaults(defaults);

        // ONLY populate the primary_address bootstrap field on new posts so the
        // address radio can offer the "primary" option. pickup_preference and
        // sensitive fields stay empty until the user opts in via the toggles
        // or taps "Använd mina standardinställningar".
        if (initialData?.id) return;
        setFormData((prev) => {
          if (prev.primary_address) return prev;
          return { ...prev, primary_address: primary };
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

  const handleImageCropsChange = (imageCrops: PostFormData['imageCrops']) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      imageCrops,
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
    profileDefaults,
    handleImagesChange,
    handleImageCropsChange,
    handleMeasurementChange,
  };
}
