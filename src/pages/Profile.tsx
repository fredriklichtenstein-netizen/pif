
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

  // Safe logging function to handle potential invalid dates
  const safeLogFormData = (data: ProfileFormData) => {
    try {
      const logData = {
        ...data,
        dateOfBirth: data.dateOfBirth instanceof Date && !isNaN(data.dateOfBirth.getTime())
          ? data.dateOfBirth.toISOString()
          : undefined
      };
      return logData;
    } catch (e) {
      console.error("Error logging form data:", e);
      return { ...data, dateOfBirth: "Invalid Date" };
    }
  };

  // Debug log
  console.log("Profile page rendering with formData:", safeLogFormData(formData));
  console.log("initialFormData:", safeLogFormData(initialFormData));

  useEffect(() => {
    try {
      // Custom comparison function for dates
      const areEqual = (a: ProfileFormData, b: ProfileFormData): boolean => {
        // Compare simple properties
        if (a.firstName !== b.firstName ||
            a.lastName !== b.lastName ||
            a.gender !== b.gender ||
            a.phone !== b.phone ||
            a.address !== b.address ||
            a.countryCode !== b.countryCode) {
          return false;
        }
        
        // Handle date comparison specially
        const aDate = a.dateOfBirth instanceof Date && !isNaN(a.dateOfBirth.getTime()) ? a.dateOfBirth : null;
        const bDate = b.dateOfBirth instanceof Date && !isNaN(b.dateOfBirth.getTime()) ? b.dateOfBirth : null;
        
        // If both dates are null/undefined, they're equal
        if (!aDate && !bDate) return true;
        // If only one is null/undefined, they're not equal
        if (!aDate || !bDate) return false;
        
        // Compare year, month, and day (ignore time)
        return (
          aDate.getFullYear() === bDate.getFullYear() &&
          aDate.getMonth() === bDate.getMonth() &&
          aDate.getDate() === bDate.getDate()
        );
      };
      
      const hasChanges = !areEqual(formData, initialFormData);
      console.log("Checking for unsaved changes:", { hasChanges });
      setHasUnsavedChanges(hasChanges);
    } catch (e) {
      console.error("Error comparing form data:", e);
      setHasUnsavedChanges(false);
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
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
    
    try {
      console.log("Form submit handler called with data:", safeLogFormData(formData));
      await handleSubmit(e as React.FormEvent);
    } catch (error) {
      console.error("Error submitting form:", error);
    }
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
