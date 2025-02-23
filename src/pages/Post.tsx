
import { PostForm } from "@/components/post/PostForm";
import { usePostForm } from "@/hooks/usePostForm";
import { useMapbox } from "@/hooks/useMapbox";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Post = () => {
  const { mapToken } = useMapbox();
  const { session } = useAuth();
  const {
    formData,
    isSubmitting,
    isGeocoding,
    isAnalyzing,
    setFormData,
    handleGeocodeAddress,
    handleImageUpload,
    handleAnalyzeImages,
    handleMeasurementChange,
    handleSubmit,
  } = usePostForm();

  // Redirect to auth page if not logged in
  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  if (!mapToken) {
    return <div className="container mx-auto px-4 py-8">Loading map configuration...</div>;
  }

  console.log("Current form data:", formData); // Debug log

  return (
    <PostForm
      formData={formData}
      isSubmitting={isSubmitting}
      isGeocoding={isGeocoding}
      isAnalyzing={isAnalyzing}
      onFormSubmit={handleSubmit}
      onGeocodeAddress={() => {
        console.log("Triggering geocode with address:", formData.location); // Debug log
        return handleGeocodeAddress(mapToken);
      }}
      onImageUpload={handleImageUpload}
      onAnalyzeImages={handleAnalyzeImages}
      onMeasurementChange={handleMeasurementChange}
      setFormData={setFormData}
    />
  );
};

export default Post;
