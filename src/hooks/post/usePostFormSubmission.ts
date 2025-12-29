
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import type { PostFormData } from "@/types/post";
import { DEMO_MODE } from "@/config/demoMode";
import { useDemoPostsStore } from "@/stores/demoPostsStore";
import { DEMO_USER } from "@/data/mockUser";

export function usePostFormSubmission(initialData?: any) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const addDemoPost = useDemoPostsStore((state) => state.addPost);
  const updateDemoPost = useDemoPostsStore((state) => state.updatePost);

  const handleSubmit = async (formData: PostFormData) => {
    console.log("Form submission started");
    console.log("Form data validation:", {
      title: !!formData.title,
      category: !!formData.category,
      condition: !!formData.condition,
      coordinates: !!formData.coordinates,
      images: formData.images.length,
      item_type: formData.item_type
    });
    
    // Demo mode handling
    if (DEMO_MODE) {
      // Validate required fields
      if (!formData.title || !formData.category || !formData.coordinates || formData.images.length === 0) {
        toast({
          title: "Obligatoriska fält saknas",
          description: "Vänligen fyll i alla obligatoriska fält och lägg till minst en bild.",
          variant: "destructive",
        });
        return;
      }

      setIsSubmitting(true);
      
      try {
        // Simulate a short delay for realism
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (initialData?.id) {
          // Update existing demo post
          updateDemoPost(initialData.id, formData);
          toast({
            title: "Din pif har uppdaterats!",
            description: "Dina ändringar har sparats (demo-läge).",
          });
        } else {
          // Add new demo post
          addDemoPost(formData, {
            id: DEMO_USER.id,
            name: DEMO_USER.user_metadata?.full_name || "Demo User",
            avatar: DEMO_USER.user_metadata?.avatar_url || "",
          });
          
          toast({
            title: formData.item_type === 'request' ? "Din önskning har skapats!" : "Din pif har skapats!",
            description: formData.item_type === 'request' 
              ? "Andra kan nu se vad du söker (demo-läge)." 
              : "Andra kan nu se din pif (demo-läge).",
          });
        }
        
        navigate("/feed");
      } catch (error) {
        console.error("Error in demo submission:", error);
        toast({
          title: "Fel",
          description: "Något gick fel i demo-läget.",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }
    
    // Check if user is authenticated (non-demo mode)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Inte inloggad",
        description: "Du måste vara inloggad för att skapa en pif eller önskning.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    
    if (!formData.title || !formData.category || !formData.condition || !formData.coordinates || formData.images.length === 0) {
      toast({
        title: "Obligatoriska fält saknas",
        description: "Vänligen fyll i alla obligatoriska fält och lägg till minst en bild.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("Starting database insertion...");
      
      // Format coordinates as a string in the format PostgreSQL expects
      let coordinatesForDB = null;
      if (formData.coordinates && formData.coordinates.lat !== null && formData.coordinates.lng !== null) {
        coordinatesForDB = `(${formData.coordinates.lng},${formData.coordinates.lat})`;
        console.log("Formatted coordinates for DB:", coordinatesForDB);
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

      console.log("Insert data prepared:", insertData);

      let result;
      if (initialData?.id) {
        console.log("Updating existing item:", initialData.id);
        result = await supabase
          .from("items")
          .update(insertData)
          .eq("id", initialData.id);
      } else {
        console.log("Inserting new item...");
        result = await supabase
          .from("items")
          .insert([insertData]);
      }

      console.log("Database operation result:", result);

      if (result.error) {
        console.error("Supabase error details:", {
          message: result.error.message,
          details: result.error.details,
          hint: result.error.hint,
          code: result.error.code
        });
        throw result.error;
      }

      console.log("Success! Showing toast and navigating...");
      
      toast({
        title: initialData?.id ? "Din pif har uppdaterats!" : 
               formData.item_type === 'request' ? "Din önskning har skapats!" : "Din pif har skapats!",
        description: initialData?.id ? "Dina ändringar har sparats." : 
                     formData.item_type === 'request' ? "Andra kan nu se vad du söker." : "Andra kan nu se din pif.",
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
      
      let errorMessage = "Något gick fel när din pif skulle sparas.";
      
      if (error.message?.includes('invalid input syntax for type point')) {
        errorMessage = "Problem med platsdata. Försök välja en annan adress.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Fel",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      console.log("Setting isSubmitting to false");
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    handleSubmit,
  };
}
