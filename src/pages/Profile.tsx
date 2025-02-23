
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { UnsavedChangesDialog } from "@/components/profile/UnsavedChangesDialog";
import { Card, CardContent } from "@/components/ui/card";
import { useProfileManagement } from "@/hooks/profile/useProfileManagement";

const Profile = () => {
  const navigate = useNavigate();
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [navigationPath, setNavigationPath] = useState<string | null>(null);

  const {
    loading,
    formData,
    initialFormData,
    avatarUrl,
    setAvatar,
    setFormData,
    handleSubmit,
  } = useProfileManagement();

  useEffect(() => {
    const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialFormData);
    setHasUnsavedChanges(hasChanges);

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [formData, initialFormData]);

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

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSubmit(e);
  };

  const handleConfirmNavigation = () => {
    setShowUnsavedChangesDialog(false);
    setHasUnsavedChanges(false);
    if (navigationPath) {
      navigate(navigationPath);
    }
  };

  const handleCancelNavigation = () => {
    setShowUnsavedChangesDialog(false);
    setNavigationPath(null);
  };

  const handleFormChange = (newData: ProfileFormData) => {
    setFormData(newData);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 pb-24">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Edit Profile
          </h1>
          <p className="mt-2 text-gray-600">
            Update your profile information
          </p>
        </div>

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
