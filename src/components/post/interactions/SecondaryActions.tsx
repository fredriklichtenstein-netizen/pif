
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ReportDialog } from "./ReportDialog";
import { ActionMenuItems } from "./ActionMenuItems";

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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-9 w-9 p-0 rounded-full bg-gray-100 hover:bg-gray-200"
          >
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">More options</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 p-2">
          <ActionMenuItems
            isBookmarked={isBookmarked}
            isOwner={isOwner}
            isDeleting={isDeleting}
            onBookmarkToggle={onBookmarkToggle}
            onShare={onShare}
            onReportClick={handleReportClick}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </DropdownMenuContent>
      </DropdownMenu>
      <ReportDialog onReport={onReport} />
    </>
  );
}
