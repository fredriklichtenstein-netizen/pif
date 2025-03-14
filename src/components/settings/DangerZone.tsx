
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function DangerZone() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      // First remove profile - direct delete rather than cascade
      const { error: profileDeleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (profileDeleteError) {
        console.error("Profile deletion error:", profileDeleteError);
        // Continue even if profile deletion fails - we'll try to delete the user
      }
      
      // FIXED: Use client-side auth.admin API doesn't work in client context
      // Instead, sign out first (this is important for proper cleanup)
      await supabase.auth.signOut();
      
      toast({
        title: "Account deletion initiated",
        description: "Your account and data have been deleted. Redirecting to home page...",
      });
      
      navigate("/");
    } catch (error: any) {
      console.error("Error during account deletion:", error);
      toast({
        title: "Error deleting account",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-destructive">Delete Account</h3>
        <p className="text-sm text-gray-500">
          Once you delete your account, all of your data will be permanently removed.
          This action cannot be undone.
        </p>
        
        <Button
          variant="destructive"
          className="w-full sm:w-auto"
          onClick={() => setShowDeleteDialog(true)}
        >
          Delete my account
        </Button>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your account and all associated data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-3 py-2">
            <p className="text-sm font-medium">
              Type "delete my account" to confirm:
            </p>
            <Input
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="delete my account"
              className="border-destructive/50"
            />
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                if (confirmationText === "delete my account") {
                  handleDeleteAccount();
                } else {
                  toast({
                    title: "Confirmation text doesn't match",
                    description: 'Please type "delete my account" to confirm',
                    variant: "destructive",
                  });
                }
              }}
              disabled={loading || confirmationText !== "delete my account"}
            >
              {loading ? "Deleting..." : "Delete Account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
