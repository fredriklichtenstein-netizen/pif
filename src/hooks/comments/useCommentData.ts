
import { useState, useEffect } from "react";
import { Comment } from "@/types/comment";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/hooks/auth/authStore";
import { resolveDisplayName } from "@/utils/displayName";

interface ProfileData {
  first_name?: string;
  last_name?: string;
  username?: string;
  avatar_url?: string;
}


export function useCommentData(itemId: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const { session } = useAuth();
  const authInitialized = useAuthStore((s) => s.initialized);
  
  // Fetch comments when component mounts
  useEffect(() => {
    if (!authInitialized) return;
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
              username,
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
          const profile = (comment.profiles as ProfileData) || null;
          const fullName = resolveDisplayName(profile as any, 'Anonymous');
          const isOwnComment = comment.user_id === session?.user?.id;


          return {
            id: comment.id.toString(),
            text: comment.content,
            author: {
              id: comment.user_id,
              name: fullName,
              avatar: profile?.avatar_url || undefined
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
  }, [itemId, session?.user?.id, authInitialized]);
  
  // Fetch profile data from the profiles table
  useEffect(() => {
    if (!authInitialized) return;
    if (session?.user?.id) {
      const fetchProfile = async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, last_name, username, avatar_url')
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
  }, [session?.user?.id, authInitialized]);

  // Construct the user's display name via the canonical resolver.
  const getFullName = () => {
    const metadataFallback =
      session?.user?.user_metadata?.full_name ||
      session?.user?.user_metadata?.name ||
      session?.user?.email?.split('@')[0] ||
      'Anonymous User';
    return resolveDisplayName(profileData as any, metadataFallback);
  };
  
  // Extract user information; avatar is undefined when no real avatar exists
  // so downstream renderers fall back to the shared animal-photo placeholder.
  const currentUser = {
    name: getFullName(),
    avatar:
      profileData?.avatar_url ||
      session?.user?.user_metadata?.avatar_url ||
      undefined,
    id: session?.user?.id
  };

  return {
    comments,
    setComments,
    isLoading,
    currentUser
  };
}
