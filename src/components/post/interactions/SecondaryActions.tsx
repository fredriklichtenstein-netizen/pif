
import React from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ReportDialog } from "./ReportDialog";
import { BookmarkPlus, BookmarkCheck, Flag } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SecondaryActionsProps {
  isBookmarked: boolean;
  isOwner?: boolean;
  onBookmarkToggle: () => void;
  onReport: () => void;
}

export function SecondaryActions({
  isBookmarked,
  isOwner = false,
  onBookmarkToggle,
  onReport,
}: SecondaryActionsProps) {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleReportClick = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "You must be signed in to report items",
        variant: "destructive",
        action: (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate("/auth")}
          >
            Sign in
          </Button>
        ),
      });
      return;
    }

    onReport();
  };

  const handleBookmarkClick = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "You must be signed in to save items",
        variant: "destructive",
        action: (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate("/auth")}
          >
            Sign in
          </Button>
        ),
      });
      return;
    }

    onBookmarkToggle();
  };

  return (
    <div className="flex items-center gap-2">
      <ReportDialog onReport={onReport} />
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            More
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!isOwner && (
            <DropdownMenuItem onClick={handleBookmarkClick}>
              {isBookmarked ? (
                <>
                  <BookmarkCheck className="mr-2 h-4 w-4" />
                  <span>Unsave</span>
                </>
              ) : (
                <>
                  <BookmarkPlus className="mr-2 h-4 w-4" />
                  <span>Save</span>
                </>
              )}
            </DropdownMenuItem>
          )}
          
          {!isOwner && (
            <DropdownMenuItem onClick={handleReportClick} className="text-destructive">
              <Flag className="mr-2 h-4 w-4" />
              <span>Report</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
