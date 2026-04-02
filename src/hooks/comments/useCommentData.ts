
import { useState, useEffect } from "react";
import { Comment } from "@/types/comment";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ProfileData {
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
}

export function useCommentData(itemId: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const { session } = useAuth();
  
  // Fetch comments when component mounts
  useEffect(() => {
    const fetchComments = async () => {
      setIsLoading(true);
      try {
        // Convert itemId to a number, handling different formats
        let numericId: number;
        
        if (typeof itemId === 'number') {
          numericId = itemId;
        } else if (typeof itemId === 'string') {
          // If it's a string, try to parse it
          numericId = parseInt(itemId, 10);
          
          // If conversion fails, log error and return
          if (isNaN(numericId)) {
            console.error(`Invalid item ID format: ${itemId}`);
            setComments([]);
            setIsLoading(false);
            return;
          }
        } else {
          console.error(`Unsupported item ID type: ${typeof itemId}`);
          setComments([]);
          setIsLoading(false);
          return;
        }
        // Fetch comments for this item
        const { data: commentsData, error } = await supabase
          .from('comments')
          .select(`
            id,
            content,
            created_at,
            user_id,
            profiles:user_id (
              first_name,
              last_name,
              avatar_url
            )
          `)
          .eq('item_id', numericId)
          .is('parent_id', null)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error from Supabase:', error);
          throw error;
        }
        
        if (!commentsData) {
          setComments([]);
          setIsLoading(false);
          return;
        }
        
        // Transform database comments into our Comment type
        const formattedComments: Comment[] = commentsData.map(comment => {
          const profile = comment.profiles as ProfileData || {};
          // Apply the new naming format (First name + first letter of last name without dot)
          const firstName = profile.first_name || '';
          const lastName = profile.last_name || '';
          const fullName = firstName && lastName 
            ? `${firstName} ${lastName.charAt(0)}`
            : firstName || 'Anonymous';
            
          const isOwnComment = comment.user_id === session?.user?.id;
          
          return {
            id: comment.id.toString(),
            text: comment.content,
            author: {
              id: comment.user_id,
              name: fullName,
              avatar: profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`
            },
            likes: 0,
            isLiked: false,
            replies: [],
            createdAt: new Date(comment.created_at),
            isOwn: isOwnComment
          };
        });
        
        setComments(formattedComments);
      } catch (error) {
        console.error('Error fetching comments:', error);
        setComments([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchComments();
  }, [itemId, session?.user?.id]);
  
  // Fetch profile data from the profiles table
  useEffect(() => {
    if (session?.user?.id) {
      const fetchProfile = async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, last_name, avatar_url')
          .eq('id', session.user.id)
          .single();
        
        if (error) {
          console.error('Error fetching profile:', error);
        } else if (data) {
          setProfileData(data);
        }
      };
      
      fetchProfile();
    }
  }, [session?.user?.id]);

  // Construct the user's full name from profile data with the new format
  const getFullName = () => {
    const firstName = profileData?.first_name || '';
    const lastName = profileData?.last_name || '';
    
    if (firstName && lastName) {
      return `${firstName} ${lastName.charAt(0)}`; // Removed dot after initial here
    }
    
    // Fall back to user metadata if profile not found
    const metadataName = session?.user?.user_metadata?.full_name || 
                         session?.user?.user_metadata?.name ||
                         session?.user?.email?.split('@')[0] || 
                         "Anonymous User";
                         
    return metadataName;
  };
  
  // Extract user information with better fallbacks
  const currentUser = {
    name: getFullName(),
    avatar: profileData?.avatar_url || 
           session?.user?.user_metadata?.avatar_url || 
           (session?.user?.id ? `https://ui-avatars.com/api/?name=${
             encodeURIComponent(getFullName())
           }&background=random` : "https://ui-avatars.com/api/?name=U&background=random"),
    id: session?.user?.id
  };

  return {
    comments,
    setComments,
    isLoading,
    currentUser
  };
}
