
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { UnsavedChangesDialog } from "@/components/profile/UnsavedChangesDialog";
import { Card, CardContent } from "@/components/ui/card";
import { useProfileManagement } from "@/hooks/profile/useProfileManagement";
import { Settings, AlertCircle, Loader2 } from "lucide-react";
import type { ProfileFormData } from "@/hooks/profile/useProfileManagement";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";

const Profile = () => {
  const navigate = useNavigate();
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [navigationPath, setNavigationPath] = useState<string | null>(null);
  const { isLoading: authLoading, user } = useGlobalAuth();

  const {
    loading,
    formData,
    initialFormData,
    avatarUrl,
    error,
    setAvatar,
    setFormData,
    handleSubmit,
  } = useProfileManagement();

  const isLoading = loading || authLoading;

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

  const handleFormSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    await handleSubmit(e as React.FormEvent);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-8 flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-gray-500">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-sm border border-red-200">
          <div className="flex flex-col items-center text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
            <h1 className="text-xl font-semibold text-red-600">Error Loading Profile</h1>
            <p className="text-gray-600">{error.message || "An unexpected error occurred"}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-sm">
          <div className="flex flex-col items-center text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-amber-500" />
            <h1 className="text-xl font-semibold">Authentication Required</h1>
            <p className="text-gray-600">Please sign in to view your profile</p>
            <Button onClick={() => navigate("/auth")}>
              Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
