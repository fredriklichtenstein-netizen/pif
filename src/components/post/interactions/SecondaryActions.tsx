
import React from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ReportDialog } from "./ReportDialog";

interface SecondaryActionsProps {
  isBookmarked: boolean;
  isOwner?: boolean;
  isDeleting?: boolean;
  onBookmarkToggle: () => void;
  onShare: () => void;
  onReport: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function SecondaryActions({
  isBookmarked,
  isOwner = false,
  isDeleting = false,
  onBookmarkToggle,
  onShare,
  onReport,
  onEdit,
  onDelete,
}: SecondaryActionsProps) {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleReportClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "You must be signed in to report items",
        className: "bg-background",
        action: (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate("/auth")}
            className="bg-transparent border-white text-white hover:bg-white/10"
          >
            Sign in
          </Button>
        ),
      });
      return;
    }

    const reportTrigger = document.querySelector('[data-report-trigger]');
    if (reportTrigger instanceof HTMLElement) {
      reportTrigger.click();
    }
  };

  return (
    <>
      <ReportDialog onReport={onReport} />
    </>
  );
}
