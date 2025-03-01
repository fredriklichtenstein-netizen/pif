
import { useState, useEffect } from "react";
import type { Comment } from "@/types/comment";
import { CommentInput } from "../comments/CommentInput";
import { CommentCard } from "../comments/CommentCard";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface CommentSectionProps {
  comments: Comment[];
  setComments: (comments: Comment[]) => void;
}

export function CommentSection({ comments, setComments }: CommentSectionProps) {
  const { session } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  
  // Debug logs to see what's in the session
  console.log("Session user:", session?.user);
  console.log("User metadata:", session?.user?.user_metadata);
  
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
  
  console.log("Current user object:", currentUser);

  const handleAddComment = (text: string) => {
    const comment = {
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
    setComments([comment, ...comments]);
  };

  const handleLikeComment = (commentId: string) => {
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

  const handleEditComment = (commentId: string, newText: string) => {
    setComments(comments.map(comment => {
      if (comment.id === commentId) {
        return { ...comment, text: newText };
      }
      return comment;
    }));
  };

  const handleDeleteComment = (commentId: string) => {
    setComments(comments.filter(comment => comment.id !== commentId));
  };

  const handleReplyToComment = (commentId: string, text: string) => {
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

  return (
    <div className="mt-4 space-y-4">
      <CommentInput onSubmit={handleAddComment} placeholder="Write a comment..." />
      <div className="space-y-4">
        {comments.map((comment) => (
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
        ))}
      </div>
    </div>
  );
}
