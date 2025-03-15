
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface ItemInteractionsProps {
  id: string;
  postedBy: {
    id?: string;
    name: string;
  };
  isLiked: boolean;
  showComments: boolean;
  isBookmarked: boolean;
  showInterest: boolean;
  isOwner?: boolean;
  onLikeToggle: () => void;
  onCommentToggle: () => void;
  onShowInterest: () => void;
  onBookmarkToggle: () => void;
  onMessage: (e: React.MouseEvent) => void;
  onShare: () => void;
  onReport: () => void;
}

export function ItemInteractions({
  id,
  postedBy,
  isLiked,
  showComments,
  isBookmarked,
  showInterest,
  isOwner = false,
  onLikeToggle,
  onCommentToggle,
  onShowInterest,
  onBookmarkToggle,
  onMessage,
  onShare,
  onReport,
}: ItemInteractionsProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMessaging, setIsMessaging] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) {
      return;
    }

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', parseInt(id, 10));

      if (error) throw error;

      toast({
        title: "Success",
        description: "Post deleted successfully",
      });
      
      window.location.reload();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: "Error",
        description: "Failed to delete post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = () => {
    navigate(`/post/edit/${id}`);
  };

  const handleStartConversation = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    try {
      setIsMessaging(true);
      
      if (!postedBy.id) {
        throw new Error("Cannot message this user");
      }
      
      // Check if user is authenticated
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        navigate('/auth');
        return;
      }
      
      // Create or get existing conversation
      const { data, error } = await supabase.rpc(
        'create_conversation',
        { 
          item_id_param: parseInt(id, 10),
          receiver_id_param: postedBy.id
        }
      );
      
      if (error) throw error;
      
      // Navigate to the conversation
      navigate(`/messages?conversation=${data}`);
      
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast({
        title: "Error",
        description: "Failed to start conversation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsMessaging(false);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button 
            onClick={onLikeToggle}
            className={`flex items-center space-x-1 ${isLiked ? 'text-primary' : 'text-gray-500'}`}
          >
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill={isLiked ? "currentColor" : "none"}
              stroke="currentColor" 
              strokeWidth="2" 
              className="h-5 w-5"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>
          
          <button 
            onClick={onCommentToggle}
            className="flex items-center space-x-1 text-gray-500"
          >
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              className="h-5 w-5"
            >
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
          </button>
          
          {!isOwner && (
            <button 
              onClick={handleStartConversation}
              disabled={isMessaging}
              className="flex items-center space-x-1 text-gray-500 ml-2"
            >
              <svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                className="h-5 w-5"
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
            </button>
          )}
        </div>

        {!isOwner && (
          <button 
            onClick={onShowInterest}
            className={`py-1.5 px-3 rounded-full text-xs font-medium ${
              showInterest 
                ? 'bg-primary text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {showInterest ? 'Intresserad' : 'Visa intresse'}
          </button>
        )}
      </div>
    </div>
  );
}
