
import React, { useState } from "react";
import { PostFormContainer } from "./form/PostFormContainer";
import { usePostForm } from "@/hooks/usePostForm";
import { useMapbox } from "@/hooks/useMapbox";
import { usePostLocation } from "@/hooks/post/usePostLocation";
import { DEMO_MODE } from "@/config/demoMode";
import { DemoModeBanner } from "@/components/feed/DemoModeBanner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface PostFormProps {
  initialData?: any;
}

const PostForm = ({ initialData }: PostFormProps = {}) => {
  const { mapToken, needsToken, setDemoToken, isLoading: mapLoading } = useMapbox();
  const [tokenInput, setTokenInput] = useState("");
  const {
    formData,
    isSubmitting,
    isAnalyzing,
    setFormData,
    handleImageUpload,
    handleImagesChange,
    handleMeasurementChange,
    handleSubmit,
  } = usePostForm(initialData);

  const { handleAddressSelect } = usePostLocation(formData, setFormData);

  // Handle token submission in demo mode
  const handleTokenSubmit = () => {
    if (tokenInput.trim()) {
      setDemoToken(tokenInput.trim());
    }
  };

  // In demo mode, if no token is available, show a helpful message with option to add token
  if (DEMO_MODE && needsToken && !mapToken) {
    return (
      <div className="container mx-auto px-4 pt-4 max-w-2xl">
        <DemoModeBanner />
        <Alert className="mb-4">
          <MapPin className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-3">
              <p className="font-medium">Kartan kräver en Mapbox-token</p>
              <p className="text-sm text-muted-foreground">
                För att använda kartfunktionen i demo-läget behöver du ange din egen Mapbox public token.
                Du kan skapa en gratis på{" "}
                <a 
                  href="https://mapbox.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline text-primary"
                >
                  mapbox.com
                </a>
              </p>
              <div className="flex gap-2">
                <Input 
                  placeholder="pk.eyJ1Ijo..." 
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleTokenSubmit} disabled={!tokenInput.trim()}>
                  Spara
                </Button>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="h-3 w-3" />
                Token sparas lokalt i din webbläsare
              </p>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show loading state while fetching map token
  if (mapLoading) {
    return <div className="container mx-auto px-4 pt-4">Laddar kartkonfiguration...</div>;
  }

  // Non-demo mode: require token
  if (!mapToken && !DEMO_MODE) {
    return <div className="container mx-auto px-4 pt-4">Laddar kartkonfiguration...</div>;
  }

  const isFormValid = 
    formData.title &&
    formData.category &&
    (DEMO_MODE || formData.condition) && // Condition optional in demo mode
    formData.coordinates &&
    formData.images.length > 0;

  return (
    <div className="relative">
      {DEMO_MODE && (
        <div className="container mx-auto px-4 pt-4 max-w-2xl">
          <DemoModeBanner />
        </div>
      )}
      <PostFormContainer
        formData={formData}
        isSubmitting={isSubmitting}
        isAnalyzing={isAnalyzing}
        onFormSubmit={handleSubmit}
        onImageUpload={handleImageUpload}
        onImagesChange={handleImagesChange}
        onMeasurementChange={handleMeasurementChange}
        setFormData={setFormData}
        onAddressSelect={handleAddressSelect}
        isFormValid={isFormValid}
      />
    </div>
  );
};

export default PostForm;
