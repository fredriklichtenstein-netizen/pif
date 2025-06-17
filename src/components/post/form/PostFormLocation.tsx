
import React from "react";
import { Label } from "@/components/ui/label";
import { AddressInput } from "@/components/profile/address/AddressInput";
import type { CreatePostInput } from "@/types/post";
import { useTranslation } from 'react-i18next';

interface PostFormLocationProps {
  formData: CreatePostInput;
  setFormData: (formData: CreatePostInput | ((prev: CreatePostInput) => CreatePostInput)) => void;
  onAddressSelect?: (address: string, coordinates: { lat: number; lng: number }) => void;
}

export function PostFormLocation({
  formData,
  setFormData,
  onAddressSelect,
}: PostFormLocationProps) {
  const { t } = useTranslation();
  const isRequest = formData.item_type === 'request';

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">
          {isRequest ? t('post.step_search_area') : t('post.step_location')}
        </h3>
        <p className="text-sm text-muted-foreground">
          {isRequest 
            ? t('post.search_area_placeholder')
            : t('post.location_placeholder')
          }
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="location">
            {isRequest ? t('post.search_area_label') : t('post.location_label')} *
          </Label>
          <AddressInput
            value={formData.location}
            onChange={(address, coordinates) => {
              setFormData(prev => ({ 
                ...prev, 
                location: address,
                coordinates: coordinates || null
              }));
              if (onAddressSelect && coordinates) {
                onAddressSelect(address, coordinates);
              }
            }}
          />
        </div>

        {isRequest ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {t('post.search_area_description')}
            </p>
            <div className="text-sm text-blue-600 bg-blue-50 p-4 rounded-lg border border-blue-200">
              <strong>🔒 {t('post.privacy_notice').split(':')[0]}:</strong> {t('post.privacy_notice').split(':')[1]}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg">
              <p><strong>💡 {t('post.location_tip').split(':')[0]}:</strong> {t('post.location_tip').split(':')[1]}</p>
            </div>
            <div className="text-sm text-green-600 bg-green-50 p-4 rounded-lg border border-green-200">
              <strong>🔒 {t('post.privacy_notice').split(':')[0]}:</strong> {t('post.privacy_notice').split(':')[1]}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
