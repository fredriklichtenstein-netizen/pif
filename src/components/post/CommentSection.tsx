
import { useState, useEffect } from "react";
import type { Comment } from "@/types/comment";
import { CommentInput } from "../comments/CommentInput";
import { CommentCard } from "../comments/CommentCard";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface CommentSectionProps {
  itemId: string;
  comments: Comment[];
  setComments: (comments: Comment[]) => void;
}

interface ProfileData {
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
}

export function CommentSection({ itemId, comments, setComments }: CommentSectionProps) {
  const { session } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
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
  }, [itemId, setComments]);
  
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

  const handleAddComment = async (text: string) => {
    if (!session?.user) return;
    
    try {
      const numericId = parseInt(itemId, 10);
      if (isNaN(numericId)) return;
      
      // Add comment to database
      const { data, error } = await supabase
        .from('comments')
        .insert([
          { 
            content: text,
            item_id: numericId, // Use numericId instead of itemId
            user_id: session.user.id
          }
        ])
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
        .single();
      
      if (error) throw error;
      
      // Create comment object
      const profile = data.profiles as ProfileData || {};
      const newComment: Comment = {
        id: data.id.toString(),
        text: data.content,
        author: {
          id: data.user_id,
          name: currentUser.name,
          avatar: currentUser.avatar
        },
        likes: 0,
        isLiked: false,
        replies: [],
        createdAt: new Date(data.created_at)
      };
      
      // Add to local state
      setComments([newComment, ...comments]);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleLikeComment = (commentId: string) => {
    // We'll implement comment likes later
    setComments(comments.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
          isLiked: !comment.isLiked,
        };
      }
      return comment;
    }));
  };

  const handleEditComment = async (commentId: string, newText: string) => {
    if (!session?.user) return;
    
    try {
      // Update comment in database
      const { error } = await supabase
        .from('comments')
        .update({ content: newText })
        .eq('id', parseInt(commentId, 10))  // Convert commentId to number
        .eq('user_id', session.user.id);
      
      if (error) throw error;
      
      // Update in local state
      setComments(comments.map(comment => {
        if (comment.id === commentId) {
          return { ...comment, text: newText };
        }
        return comment;
      }));
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!session?.user) return;
    
    try {
      // Delete from database
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', parseInt(commentId, 10))  // Convert commentId to number
        .eq('user_id', session.user.id);
      
      if (error) throw error;
      
      // Remove from local state
      setComments(comments.filter(comment => comment.id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleReplyToComment = (commentId: string, text: string) => {
    // We'll implement nested comments later
    const reply = {
      id: Date.now().toString(),
      text,
      author: {
        name: currentUser.name,
        avatar: currentUser.avatar,
        id: currentUser.id
      },
      likes: 0,
      isLiked: false,
      replies: [],
      createdAt: new Date(),
    };

    setComments(comments.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          replies: [reply, ...comment.replies],
        };
      }
      return comment;
    }));
  };

  const handleReportComment = (commentId: string) => {
    // This is handled by the toast in the CommentCard component
  };

  if (isLoading) {
    return <div className="mt-4 py-4 text-center text-gray-500">Loading comments...</div>;
  }

  return (
    <div className="mt-4 space-y-4">
      <CommentInput onSubmit={handleAddComment} placeholder="Write a comment..." />
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="py-4 text-center text-gray-500">No comments yet. Be the first to comment!</div>
        ) : (
          comments.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              onLike={handleLikeComment}
              onDelete={handleDeleteComment}
              onEdit={handleEditComment}
              onReply={handleReplyToComment}
              onReport={handleReportComment}
              currentUser={currentUser.id}
            />
          ))
        )}
      </div>
    </div>
  );
}
