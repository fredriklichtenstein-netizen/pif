
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import type { PostFormData } from "@/types/post";
import { DEMO_MODE } from "@/config/demoMode";
import { useDemoPostsStore } from "@/stores/demoPostsStore";
import { DEMO_USER } from "@/data/mockUser";
import { useTranslation } from "react-i18next";

export function usePostFormSubmission(initialData?: any) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const addDemoPost = useDemoPostsStore((state) => state.addPost);
  const updateDemoPost = useDemoPostsStore((state) => state.updatePost);
  const { t } = useTranslation();

  const handleSubmit = async (formData: PostFormData) => {
    if (DEMO_MODE) {
      if (!formData.title || !formData.category || !formData.coordinates || formData.images.length === 0) {
        toast({
          title: t('post.required_fields_missing'),
          description: t('post.required_fields_description'),
          variant: "destructive",
        });
        return;
      }

      setIsSubmitting(true);
      
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (initialData?.id) {
          updateDemoPost(initialData.id, formData);
          toast({
            title: t('post.pif_updated'),
            description: t('post.pif_updated_demo_description'),
          });
        } else {
          addDemoPost(formData, {
            id: DEMO_USER.id,
            name: DEMO_USER.user_metadata?.full_name || "Demo User",
            avatar: DEMO_USER.user_metadata?.avatar_url || "",
          });
          
          toast({
            title: formData.item_type === 'request' ? t('post.request_created') : t('post.pif_created'),
            description: formData.item_type === 'request' 
              ? t('post.request_created_demo_description')
              : t('post.pif_created_demo_description'),
          });
        }
        
        navigate("/feed");
      } catch (error) {
        console.error("Error in demo submission:", error);
        toast({
          title: t('post.error'),
          description: t('post.error_demo'),
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: t('post.not_logged_in'),
        description: t('post.not_logged_in_description'),
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    
    if (!formData.title || !formData.category || !formData.condition || !formData.coordinates || formData.images.length === 0) {
      toast({
        title: t('post.required_fields_missing'),
        description: t('post.required_fields_description'),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let coordinatesForDB = null;
      if (formData.coordinates && formData.coordinates.lat !== null && formData.coordinates.lng !== null) {
        coordinatesForDB = `(${formData.coordinates.lng},${formData.coordinates.lat})`;
      }
      
      const insertData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        condition: formData.condition,
        item_type: formData.item_type,
        pif_status: 'active',
        user_id: user.id,
        coordinates: coordinatesForDB,
        location: formData.location,
        images: formData.images,
        measurements: formData.measurements,
      };
      let result;
      if (initialData?.id) {
        result = await supabase
          .from("items")
          .update(insertData)
          .eq("id", initialData.id);
      } else {
        result = await supabase
          .from("items")
          .insert([insertData]);
      }
      if (result.error) {
        console.error("Supabase error details:", {
          message: result.error.message,
          details: result.error.details,
          hint: result.error.hint,
          code: result.error.code
        });
        throw result.error;
      }
      // Invalidate feed queries so new post appears immediately
      await queryClient.invalidateQueries({ queryKey: ['posts'] });

      toast({
        title: initialData?.id ? t('post.pif_updated') : 
               formData.item_type === 'request' ? t('post.request_created') : t('post.pif_created'),
        description: initialData?.id ? t('post.pif_updated_description') : 
                     formData.item_type === 'request' ? t('post.request_created_description') : t('post.pif_created_description'),
      });

      navigate("/feed");
    } catch (error: any) {
      console.error("Error in handleSubmit:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        stack: error.stack
      });
      
      let errorMessage = t('post.error_saving');
      
      if (error.message?.includes('invalid input syntax for type point')) {
        errorMessage = t('post.error_location');
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: t('post.error'),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    handleSubmit,
  };
}
