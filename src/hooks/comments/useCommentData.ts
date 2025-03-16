
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
        // Convert itemId to a number
        const numericId = parseInt(itemId, 10);
        if (isNaN(numericId)) return;
        
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
        
        if (error) throw error;
        
        // Transform database comments into our Comment type
        const formattedComments: Comment[] = commentsData.map(comment => {
          const profile = comment.profiles as ProfileData || {};
          const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Anonymous';
          
          return {
            id: comment.id.toString(),
            text: comment.content,
            author: {
              id: comment.user_id,
              name: fullName,
              avatar: profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`
            },
            likes: 0, // We'll implement comment likes later
            isLiked: false,
            replies: [], // We'll implement replies later
            createdAt: new Date(comment.created_at)
          };
        });
        
        setComments(formattedComments);
      } catch (error) {
        console.error('Error fetching comments:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchComments();
  }, [itemId]);
  
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
          console.log('Fetched profile data:', data);
          setProfileData(data);
        }
      };
      
      fetchProfile();
    }
  }, [session?.user?.id]);

  // Construct the user's full name from profile data
  const getFullName = () => {
    if (profileData?.first_name && profileData?.last_name) {
      return `${profileData.first_name} ${profileData.last_name}`;
    }
    
    // Fall back to user metadata if profile not found
    return session?.user?.user_metadata?.full_name || 
           session?.user?.user_metadata?.name ||
           session?.user?.email?.split('@')[0] || 
           "Anonymous User";
  };
  
  // Extract user information with better fallbacks
  const currentUser = {
    // Get user name prioritizing profile data over metadata
    name: getFullName(),
    // Use profile avatar if available, otherwise fall back to generated avatar
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
