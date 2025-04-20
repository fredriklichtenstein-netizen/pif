
import { useState } from "react";
import { Comment } from "@/types/comment";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatCommentFromDB } from "@/hooks/item/utils/commentFormatters";
import { v4 as uuidv4 } from "uuid";

export const useCommentCreate = (
  itemId: string,
  comments: Comment[],
  setComments: (comments: Comment[]) => void,
  currentUser?: {
    id?: string;
    name?: string;
    avatar?: string;
  },
  useFallbackMode = false
) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Format user name as "First name + first letter of last name"
  const formatUserName = (fullName: string): string => {
    if (!fullName) return 'User';
    
    const parts = fullName.split(' ');
    if (parts.length > 1) {
      return `${parts[0]} ${parts[parts.length - 1].charAt(0)}`;
    }
    return fullName;
  };

  // Add a new comment
  const handleAddComment = async (text: string) => {
    if (!text.trim() || !currentUser || !currentUser.id) {
      console.log("Cannot add comment: empty text or missing user", { 
        textLength: text?.length, 
        currentUser: !!currentUser 
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // If in fallback mode, create a local comment
      if (useFallbackMode) {
        console.log("Creating local comment in fallback mode");
        
        // Format the display name properly
        const displayName = formatUserName(currentUser.name || '');
        
        // Create a fallback comment with a temporary ID
        const tempComment: Comment = {
          id: `local-${uuidv4()}`,
          text: text.trim(),
          author: {
            id: currentUser.id,
            name: displayName,
            avatar: currentUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`
          },
          createdAt: new Date(),
          likes: 0,
          isLiked: false,
          replies: [],
          isOwn: true,
          isPending: true  // Mark as pending to show it's not yet synced
        };
        
        // Add to local state
        const updatedComments = [...comments, tempComment];
        console.log("Adding local comment to state", { 
          previousCount: comments.length, 
          newCount: updatedComments.length,
          newComment: tempComment
        });
        
        setComments(updatedComments);
        
        // Store in local storage for later sync
        try {
          const pendingComments = JSON.parse(localStorage.getItem(`pending_comments_${itemId}`) || '[]');
          pendingComments.push({
            id: tempComment.id,
            itemId,
            content: text.trim(),
            userId: currentUser.id,
            createdAt: new Date().toISOString()
          });
          localStorage.setItem(`pending_comments_${itemId}`, JSON.stringify(pendingComments));
        } catch (err) {
          console.error("Failed to store pending comment in localStorage:", err);
        }
        
        // Show success toast
        toast({
          title: "Comment saved locally",
          description: "Your comment will be uploaded when connection improves",
        });
        
        setIsLoading(false);
        return;
      }
      
      // Regular online mode - send to server
      // Parse the itemId to ensure it's a number
      const numericItemId = parseInt(itemId);
      if (isNaN(numericItemId)) {
        throw new Error(`Invalid item ID: ${itemId}`);
      }
      
      console.log(`Adding comment to item ${numericItemId}: "${text.substring(0, 20)}..."`);
      
      const { data, error } = await supabase
        .from('comments')
        .insert({
          item_id: numericItemId,
          user_id: currentUser.id,
          content: text
        })
        .select(`
          id,
          content,
          created_at,
          user_id,
          profiles:user_id (
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .single();
        
      if (error) throw error;
      
      if (data) {
        console.log("Comment successfully added:", data);
        const newComment = formatCommentFromDB(data, true);
        
        // Create a new array with the new comment added (avoid direct mutation)
        const updatedComments = [...comments, newComment];
        console.log("Updating comments state with new comment", { 
          previousCount: comments.length, 
          newCount: updatedComments.length 
        });
        
        setComments(updatedComments);
        
        toast({
          title: "Comment posted",
          description: "Your comment has been added successfully",
        });
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleAddComment,
    isCreating: isLoading
  };
};
