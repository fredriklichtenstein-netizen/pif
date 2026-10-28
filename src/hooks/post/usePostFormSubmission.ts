
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
import { clearPostsCache } from "@/services/posts/optimized";
import { buildItemFields } from "@/services/items/itemFields";
import { formatScheduleTime } from "@/lib/schedule";
import { DRAFTS_QUERY_KEY, draftErrorKey, publishDraft, saveDraft } from "@/services/drafts";

export function usePostFormSubmission(initialData?: any) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const addDemoPost = useDemoPostsStore((state) => state.addPost);
  const updateDemoPost = useDemoPostsStore((state) => state.updatePost);
  const { t, i18n } = useTranslation();

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
      const insertData = {
        ...buildItemFields(formData),
        pif_status: 'active',
        user_id: user.id,
      } as any;
      let result;
      if (initialData?.draftId) {
        // Publishing an existing draft: save the latest form state (clearing
        // any schedule), then let publish_draft move it into items.
        try {
          await saveDraft(formData, initialData.draftId, null);
          await publishDraft(initialData.draftId);
          result = { error: null };
        } catch (draftError) {
          result = { error: draftError as any };
        }
        queryClient.invalidateQueries({ queryKey: DRAFTS_QUERY_KEY });
      } else if (initialData?.id) {
        result = await supabase
          .from("items")
          .update(insertData)
          .eq("id", initialData.id);
      } else {
        result = await (supabase
          .from("items") as any)
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
      // Clear secondary feed caches before invalidating; otherwise the
      // publisher can navigate to /feed and get a stale cached first page
      // before the INSERT realtime event is observed there.
      clearPostsCache();
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
      
      const draftKey = draftErrorKey(error);
      if (draftKey) {
        errorMessage = t(draftKey);
      } else if (error.message?.includes('invalid input syntax for type point')) {
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

  /**
   * Saves the form as a draft (new or existing). With `scheduledAt`, the
   * draft is also scheduled; the database rejects a schedule unless the
   * draft is complete and the time is within the allowed window.
   */
  const saveAsDraft = async (formData: PostFormData, scheduledAt?: Date | null): Promise<boolean> => {
    if (DEMO_MODE) return false;
    const hasContent =
      formData.title.trim() !== "" || formData.description.trim() !== "" || formData.images.length > 0;
    if (!hasContent) {
      toast({ title: t('drafts.nothing_to_save'), variant: "destructive" });
      return false;
    }

    setIsSubmitting(true);
    try {
      await saveDraft(formData, initialData?.draftId ?? null, scheduledAt);
      await queryClient.invalidateQueries({ queryKey: DRAFTS_QUERY_KEY });
      toast({
        title: scheduledAt ? t('drafts.scheduled_toast') : t('drafts.saved_toast'),
        description: scheduledAt
          ? t('drafts.scheduled_toast_description', { when: formatScheduleTime(scheduledAt, i18n.language) })
          : undefined,
      });
      navigate("/drafts");
      return true;
    } catch (error: any) {
      console.error("Error saving draft:", error);
      const key = draftErrorKey(error);
      toast({
        title: t('post.error'),
        description: key ? t(key) : t('drafts.error_saving'),
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    handleSubmit,
    saveAsDraft,
  };
}
