
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface ItemOwnerActionsProps {
  id: string;
}

export function ItemOwnerActions({ id }: ItemOwnerActionsProps) {
  const [isDeleting, setIsDeleting] = useState(false);
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

  return (
    <div className="flex gap-2 mt-2">
      <Button variant="outline" size="sm" onClick={handleEdit}>
        Edit
      </Button>
      <Button 
        variant="destructive" 
        size="sm" 
        onClick={handleDelete}
        disabled={isDeleting}
      >
        {isDeleting ? "Deleting..." : "Delete"}
      </Button>
    </div>
  );
}
