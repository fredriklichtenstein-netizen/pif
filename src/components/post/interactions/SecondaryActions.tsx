import { Flag, Share2, Bookmark, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface SecondaryActionsProps {
  isBookmarked: boolean;
  onBookmarkToggle: () => void;
  onShare: () => void;
  onReport: () => void;
}

export function SecondaryActions({
  isBookmarked,
  onBookmarkToggle,
  onShare,
  onReport,
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
        variant: "destructive",
        action: (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate("/auth")}
            className="border-destructive-foreground text-destructive-foreground hover:bg-destructive/10"
          >
            Sign in
          </Button>
        ),
      });
      return;
    }

    // If user is authenticated, show the report confirmation dialog
    const reportTrigger = document.querySelector('[data-report-trigger]');
    if (reportTrigger instanceof HTMLElement) {
      reportTrigger.click();
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={onBookmarkToggle}>
          <Bookmark className={`mr-2 h-4 w-4 ${isBookmarked ? "fill-current" : ""}`} />
          {isBookmarked ? "Saved" : "Save item"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onShare}>
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={handleReportClick}>
          <Flag className="mr-2 h-4 w-4" />
          Report
        </DropdownMenuItem>
        <AlertDialog>
          <AlertDialogTrigger data-report-trigger className="hidden">
            Report
          </AlertDialogTrigger>
          <AlertDialogContent className="sm:max-w-[425px]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg font-semibold text-primary">
                Report this item
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-muted-foreground">
                Are you sure you want to report this item? This action cannot be undone.
                Our moderators will review the item and take appropriate action.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-4">
              <AlertDialogCancel className="bg-gray-100 hover:bg-gray-200">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={onReport}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Report Item
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}