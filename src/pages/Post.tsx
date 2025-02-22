
import { MapboxTokenInput } from "@/components/post/MapboxTokenInput";
import { PostForm } from "@/components/post/PostForm";
import { usePostForm } from "@/hooks/usePostForm";

const Post = () => {
  const {
    formData,
    isSubmitting,
    isGeocoding,
    mapboxToken,
    setMapboxToken,
    setFormData,
    handleGeocodeAddress,
    handleImageUpload,
    handleMeasurementChange,
    handleSubmit,
  } = usePostForm();

  if (!mapboxToken) {
    return (
      <MapboxTokenInput
        mapboxToken={mapboxToken}
        setMapboxToken={setMapboxToken}
      />
    );
  }

  return (
    <PostForm
      formData={formData}
      isSubmitting={isSubmitting}
      isGeocoding={isGeocoding}
      onFormSubmit={handleSubmit}
      onGeocodeAddress={handleGeocodeAddress}
      onImageUpload={handleImageUpload}
      onMeasurementChange={handleMeasurementChange}
      setFormData={setFormData}
    />
  );
};

export default Post;
