
import { PostForm } from "@/components/post/PostForm";
import { usePostForm } from "@/hooks/usePostForm";
import { useMapbox } from "@/hooks/useMapbox";

const Post = () => {
  const { mapToken } = useMapbox();
  const {
    formData,
    isSubmitting,
    isGeocoding,
    isAnalyzing,
    setFormData,
    handleGeocodeAddress,
    handleImageUpload,
    handleMeasurementChange,
    handleSubmit,
  } = usePostForm();

  if (!mapToken) {
    return <div className="container mx-auto px-4 py-8">Loading map configuration...</div>;
  }

  return (
    <PostForm
      formData={formData}
      isSubmitting={isSubmitting}
      isGeocoding={isGeocoding}
      isAnalyzing={isAnalyzing}
      onFormSubmit={handleSubmit}
      onGeocodeAddress={() => handleGeocodeAddress(mapToken)}
      onImageUpload={handleImageUpload}
      onMeasurementChange={handleMeasurementChange}
      setFormData={setFormData}
    />
  );
};

export default Post;
