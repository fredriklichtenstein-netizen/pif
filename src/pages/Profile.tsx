
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { UnsavedChangesDialog } from "@/components/profile/UnsavedChangesDialog";
import { Card, CardContent } from "@/components/ui/card";
import { useProfileManagement } from "@/hooks/profile/useProfileManagement";
import { Settings } from "lucide-react";
import type { ProfileFormData } from "@/hooks/profile/useProfileManagement";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
  const [navigationPath, setNavigationPath] = useState<string | null>(null);

  const {
    loading,
    formData,
    initialFormData,
    avatarUrl,
    setAvatar,
    setFormData,
    hasUnsavedChanges,
    handleSubmit,
  } = useProfileManagement();

  // Safe logging function to handle potential invalid dates
  const safeLogFormData = (data: ProfileFormData) => {
    try {
      const logData = {
        ...data,
        dateOfBirth: data.dateOfBirth instanceof Date && !isNaN(data.dateOfBirth.getTime())
          ? data.dateOfBirth.toISOString().split('T')[0]
          : "Invalid or missing date"
      };
      return logData;
    } catch (e) {
      console.error("Error logging form data:", e);
      return { ...data, dateOfBirth: "Error in date" };
    }
  };

  // Debug log
  console.log("Profile page rendering with formData:", safeLogFormData(formData));
  console.log("initialFormData:", safeLogFormData(initialFormData));

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleNavigation = (e: PopStateEvent) => {
      e.preventDefault();
      setNavigationPath(window.location.pathname);
      setShowUnsavedChangesDialog(true);
      window.history.pushState(null, '', window.location.pathname);
    };

    window.addEventListener('popstate', handleNavigation);
    return () => window.removeEventListener('popstate', handleNavigation);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleFormSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    try {
      console.log("Form submit handler called with data:", safeLogFormData(formData));
      const success = await handleSubmit(e as React.FormEvent);
      
      if (success) {
        toast({
          title: "Profile updated",
          description: "Your profile has been successfully updated",
        });
      } else {
        toast({
          title: "Update failed",
          description: "There was a problem updating your profile",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleConfirmNavigation = () => {
    setShowUnsavedChangesDialog(false);
    if (navigationPath) {
      navigate(navigationPath);
    }
  };

  const handleCancelNavigation = () => {
    setShowUnsavedChangesDialog(false);
    setNavigationPath(null);
  };

  const handleFormChange = (newData: ProfileFormData) => {
    console.log("Form change handler called with data:", safeLogFormData(newData));
    setFormData(newData);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 pb-24">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">
            Edit Profile
          </h1>
          <Link to="/account-settings">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Settings size={16} />
              <span>Account Settings</span>
            </Button>
          </Link>
        </div>
        <p className="mt-2 text-gray-600">
          Update your profile information
        </p>

        <form onSubmit={handleFormSubmit} className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <AvatarUpload 
                avatarUrl={avatarUrl}
                onFileChange={setAvatar}
              />
            </CardContent>
          </Card>

          <ProfileForm 
            formData={formData}
            onChange={handleFormChange}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Updating profile..." : "Update profile"}
          </Button>
        </form>
      </div>

      <UnsavedChangesDialog
        open={showUnsavedChangesDialog}
        onOpenChange={setShowUnsavedChangesDialog}
        onConfirm={handleConfirmNavigation}
        onCancel={handleCancelNavigation}
        onSave={handleFormSubmit}
      />
    </div>
  );
};

export default Profile;
