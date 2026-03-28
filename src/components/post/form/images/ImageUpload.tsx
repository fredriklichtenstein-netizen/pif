
import React from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "react-i18next";

interface ImageUploadProps {
  isAnalyzing?: boolean;
  uploadProgress?: number;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isPrimaryImageRequired?: boolean;
  variant: 'primary' | 'secondary';
}

export function ImageUpload({ 
  isAnalyzing, 
  uploadProgress = 0,
  onImageUpload, 
  isPrimaryImageRequired,
  variant
}: ImageUploadProps) {
  const isPrimary = variant === 'primary';
  const { t } = useTranslation();

  return (
    <label className={`
      relative block border-2 border-dashed rounded-lg cursor-pointer 
      transition-colors
      ${isPrimary 
        ? 'h-60 border-primary hover:bg-primary/5' 
        : 'h-40 aspect-square border-border hover:border-primary'
      }
      ${isAnalyzing ? 'opacity-70 cursor-wait' : ''}
    `}>
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
        {isAnalyzing ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <span className="text-sm text-primary font-medium">{t('interactions.uploading')}</span>
            {uploadProgress > 0 && (
              <div className="w-4/5 mt-2">
                <Progress value={uploadProgress} className="h-2" />
                <span className="text-xs text-muted-foreground mt-1">{t('interactions.percent_complete', { percent: uploadProgress })}</span>
              </div>
            )}
            {!uploadProgress && (
              <span className="text-xs text-muted-foreground mt-1">{t('interactions.please_wait')}</span>
            )}
          </>
        ) : (
          <>
            <ImagePlus className={`mb-2 ${isPrimary ? 'h-10 w-10 text-primary' : 'h-8 w-8 text-muted-foreground'}`} />
            <span className={`text-sm text-center ${isPrimary ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
              {isPrimaryImageRequired 
                ? t('interactions.upload_primary_photo')
                : t('interactions.add_more_photos')}
            </span>
            {isPrimary && (
              <span className="text-xs text-muted-foreground mt-1">
                {t('interactions.click_or_drag')}
              </span>
            )}
          </>
        )}
      </div>
      <input
        type="file"
        accept="image/*"
        multiple={!isPrimaryImageRequired}
        className="hidden"
        onChange={onImageUpload}
        required={isPrimaryImageRequired}
        aria-label={isPrimaryImageRequired ? t('interactions.upload_primary_aria') : t('interactions.upload_additional_aria')}
        disabled={isAnalyzing}
      />
    </label>
  );
}
