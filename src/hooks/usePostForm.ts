
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import type { CreatePostInput } from "@/types/post";
import { addPost } from "@/pages/Index";
import { geocodeAddress } from "@/utils/geocoding";
import { supabase } from "@/integrations/supabase/client";

export const usePostForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [formData, setFormData] = useState<CreatePostInput>({
    title: "",
    description: "",
    category: "",
    condition: "",
    measurements: {},
    images: [],
    location: "",
    coordinates: undefined,
    status: "available",
  });

  // Fetch user's profile address on mount
  useEffect(() => {
    async function fetchProfileAddress() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('address')
          .eq('id', user.id)
          .single();

        if (profile?.address) {
          setFormData(prev => ({ ...prev, location: profile.address }));
        }
      }
    }
    fetchProfileAddress();
  }, []);

  const analyzeImage = async (imageUrl: string) => {
    try {
      setIsAnalyzing(true);
      
      const { data, error } = await supabase.functions.invoke('analyze-image', {
        body: { imageUrl },
      });

      if (error) {
        console.error('Image analysis error:', error);
        toast({
          title: "Analysis failed",
          description: "Could not analyze the image. Please fill in the details manually.",
          variant: "destructive",
        });
        return;
      }

      // Only update fields that have values and aren't empty strings
      const updates: Partial<CreatePostInput> = {};
      if (data.title && data.title.trim()) updates.title = data.title;
      if (data.description && data.description.trim()) updates.description = data.description;
      if (data.category && data.category.trim()) updates.category = data.category;
      if (data.condition && data.condition.trim()) updates.condition = data.condition;

      setFormData(prev => ({
        ...prev,
        ...updates
      }));

      toast({
        title: "Image analyzed",
        description: "Post details have been generated from your image.",
      });
    } catch (error) {
      console.error('Image analysis error:', error);
      toast({
        title: "Analysis failed",
        description: "Could not analyze the image. Please fill in the details manually.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGeocodeAddress = async (mapboxToken: string) => {
    if (!formData.location) {
      toast({
        title: "Missing address",
        description: "Please enter an address first.",
        variant: "destructive",
      });
      return;
    }
    
    setIsGeocoding(true);
    try {
      const coordinates = await geocodeAddress(formData.location, mapboxToken);
      setFormData(prev => ({ ...prev, coordinates }));
      
      toast({
        title: "Location found",
        description: "Address has been successfully geocoded.",
      });
    } catch (error) {
      console.error("Geocoding error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to geocode address. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const imageUrls = Array.from(files).map((file) =>
      URL.createObjectURL(file)
    );
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...imageUrls],
    }));
  };

  const handleAnalyzeImages = async () => {
    if (formData.images.length === 0) {
      toast({
        title: "No images",
        description: "Please upload at least one image to analyze.",
        variant: "destructive",
      });
      return;
    }

    await analyzeImage(formData.images[0]);
  };

  const handleMeasurementChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      measurements: {
        ...prev.measurements,
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      await addPost(formData);
      await queryClient.invalidateQueries({ queryKey: ["posts"] });
      
      toast({
        title: "Success!",
        description: "Your item has been posted.",
      });
      
      navigate("/");
    } catch (error) {
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
    handleMeasurementChange,
    handleSubmit,
  };
};
