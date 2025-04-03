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
import { Skeleton } from "@/components/ui/skeleton";

const Profile = () => {
  const navigate = useNavigate();
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [navigationPath, setNavigationPath] = useState<string | null>(null);
  const { isLoading: authLoading, user } = useGlobalAuth();
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);

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
    let timeoutId: NodeJS.Timeout | null = null;
    
    if (isLoading) {
      setLoadingTimedOut(false);
      timeoutId = setTimeout(() => {
        if (isLoading) {
          setLoadingTimedOut(true);
        }
      }, 5000);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isLoading]);

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

  const handleRetry = () => {
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48 mt-2" />
            </div>
            <Skeleton className="h-10 w-36" />
          </div>
          
          <Card>
            <CardContent className="p-8 flex justify-center">
              <Skeleton className="h-24 w-24 rounded-full" />
            </CardContent>
          </Card>
          
          <div className="space-y-4">
            <Card>
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-4 w-32" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
            
            <Skeleton className="h-10 w-full" />
          </div>
          
          <div className="flex flex-col items-center mt-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-gray-500">Loading your profile...</p>
            
            {loadingTimedOut && (
              <div className="mt-4 text-center">
                <p className="text-amber-600 mb-2">This is taking longer than usual.</p>
                <Button variant="outline" size="sm" onClick={handleRetry}>
                  Refresh page
                </Button>
              </div>
            )}
          </div>
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
            <Button onClick={handleRetry}>
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
