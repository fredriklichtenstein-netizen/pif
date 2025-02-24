
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import type { CreatePostInput } from "@/types/post";
import { addPost } from "@/pages/Index";
import { supabase } from "@/integrations/supabase/client";
import { usePostImages } from "./post/usePostImages";
import { usePostLocation } from "./post/usePostLocation";
import { useAuth } from "@/hooks/useAuth";

export const usePostForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreatePostInput>({
    title: "",
    description: "",
    category: "",
    condition: "",
    measurements: {},
    images: [],
    location: "",
    coordinates: null,
    status: "available",
  });

  // Image-related functionality
  const { isAnalyzing, handleImageUpload, handleAnalyzeImages } = usePostImages(formData, setFormData);

  // Location-related functionality
  const { isGeocoding, handleGeocodeAddress } = usePostLocation(formData, setFormData);

  // Fetch user's profile address on mount
  useEffect(() => {
    let isMounted = true;

    async function fetchProfileAddress() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('address')
          .eq('id', user.id)
          .single();

        if (!profile?.address || !isMounted) return;

        // Update form with the address first
        setFormData(prev => ({ ...prev, location: profile.address }));

        // Then geocode it, but don't show error toasts for the initial load
        const { data, error } = await supabase.functions.invoke("get-mapbox-token");
        if (!error && data?.token && isMounted) {
          try {
            await handleGeocodeAddress(data.token, true); // Pass true to indicate this is the initial load
          } catch (error) {
            console.error('Initial geocoding error:', error);
            // Don't show toast for initial geocoding errors
          }
        }
      } catch (error) {
        console.error('Error fetching profile address:', error);
      }
    }

    fetchProfileAddress();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to post items.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    if (!formData.coordinates) {
      toast({
        title: "Missing location",
        description: "Please enter and verify a valid address.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const postDataWithUser = {
        ...formData,
        user_id: session.user.id,
      };

      await addPost(postDataWithUser);
      await queryClient.invalidateQueries({ queryKey: ["posts"] });
      
      toast({
        title: "Success!",
        description: "Your item has been posted.",
      });
      
      navigate("/");
    } catch (error) {
      console.error("Error submitting post:", error);
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    isSubmitting,
    isGeocoding,
    isAnalyzing,
    setFormData,
    handleGeocodeAddress,
    handleImageUpload,
    handleAnalyzeImages,
    handleSubmit,
  };
};
