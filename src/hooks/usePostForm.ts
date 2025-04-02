
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import type { CreatePostInput } from "@/types/post";
import { addPost } from "@/services/posts";
import { supabase } from "@/integrations/supabase/client";
import { usePostLocation } from "./post/usePostLocation";
import { useAuth } from "@/hooks/useAuth";

export const usePostForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
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
    user_id: undefined,
  });

  // Location-related functionality
  const { isGeocoding } = usePostLocation(formData, setFormData);

  // Image-related functionality
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setIsAnalyzing(true);
    const newImages = [...formData.images];
    
    for (const file of e.target.files) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          newImages.push(e.target.result as string);
          setFormData(prev => ({ ...prev, images: newImages }));
        }
      };
      reader.readAsDataURL(file);
    }
    
    setIsAnalyzing(false);
  };

  const handleImagesChange = (newImages: string[]) => {
    setFormData(prev => ({ ...prev, images: newImages }));
  };

  // Fetch user's profile address on mount
  useEffect(() => {
    const fetchProfileAddress = async () => {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('address')
          .single();

        if (profile?.address) {
          sessionStorage.setItem('profile_address', profile.address);
        }
      } catch (error) {
        console.error('Error fetching profile address:', error);
      }
    };

    if (session?.user) {
      fetchProfileAddress();
    }
  }, [session]);

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

    if (!formData.title || !formData.category || !formData.condition) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields (title, category, and condition).",
        variant: "destructive",
      });
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

    if (formData.images.length === 0) {
      toast({
        title: "Missing images",
        description: "Please upload at least one image.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const postData: CreatePostInput = {
        ...formData,
        user_id: session.user.id,
      };

      await addPost(postData);
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

  const handleMeasurementChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      measurements: {
        ...prev.measurements,
        [field]: value
      }
    }));
  };

  return {
    formData,
    isSubmitting,
    isGeocoding,
    isAnalyzing,
    setFormData,
    handleImageUpload,
    handleImagesChange,
    handleMeasurementChange,
    handleSubmit,
  };
};
