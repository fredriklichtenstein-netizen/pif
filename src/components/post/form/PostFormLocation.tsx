
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AddressInput } from "@/components/profile/address/AddressInput";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import type { PostFormData } from "@/types/post";
import { useTranslation } from 'react-i18next';

interface PostFormLocationProps {
  formData: PostFormData;
  setFormData: (formData: PostFormData | ((prev: PostFormData) => PostFormData)) => void;
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

        <Collapsible className="border rounded-lg">
          <CollapsibleTrigger className="flex w-full items-center justify-between p-4 text-sm font-medium hover:bg-muted/30 transition-colors">
            <span>{t('post.pickup_details_optional')}</span>
            <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="p-4 pt-0 space-y-4">
            <div className="space-y-2">
              <Label>{t('post.pickup_preference')}</Label>
              <RadioGroup
                value={formData.pickup_preference || ''}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    pickup_preference: value as 'meetup' | 'leave_at_door',
                  }))
                }
                className="flex flex-col gap-2"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="meetup" id="post-pp-meetup" />
                  <Label htmlFor="post-pp-meetup" className="font-normal cursor-pointer">
                    {t('post.pickup_meetup')}
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="leave_at_door" id="post-pp-leave" />
                  <Label htmlFor="post-pp-leave" className="font-normal cursor-pointer">
                    {t('post.pickup_leave_at_door')}
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {formData.pickup_preference && (
              <div className="space-y-3">
                <Label>{t('post.pickup_address')}</Label>
                <RadioGroup
                  value={formData.pickup_address_mode || 'primary'}
                  onValueChange={(value) =>
                    setFormData((prev) => {
                      const mode = value as 'primary' | 'custom';
                      return {
                        ...prev,
                        pickup_address_mode: mode,
                        pickup_address:
                          mode === 'primary'
                            ? (prev.primary_address || '')
                            : (prev.pickup_address === prev.primary_address ? '' : prev.pickup_address || ''),
                      };
                    })
                  }
                  className="flex flex-col gap-2"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="primary" id="post-pa-primary" />
                    <Label htmlFor="post-pa-primary" className="font-normal cursor-pointer">
                      {t('profile.pickup_use_primary')}
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="custom" id="post-pa-custom" />
                    <Label htmlFor="post-pa-custom" className="font-normal cursor-pointer">
                      {t('profile.pickup_use_other')}
                    </Label>
                  </div>
                </RadioGroup>

                {formData.pickup_address_mode === 'custom' ? (
                  <AddressInput
                    value={formData.pickup_address || ''}
                    onChange={(addr) =>
                      setFormData((prev) => ({
                        ...prev,
                        pickup_address_mode: 'custom',
                        pickup_address: addr,
                      }))
                    }
                    hideSearch
                  />
                ) : (
                  <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                    {formData.primary_address || t('profile.pickup_no_primary')}
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  {t('profile.pickup_address_in_use')}:{' '}
                  <span className="font-medium text-foreground">
                    {(formData.pickup_address_mode === 'custom'
                      ? formData.pickup_address
                      : formData.primary_address) || t('profile.pickup_no_address_set')}
                  </span>
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="preferred-time-window">
                {t('post.preferred_time_window')}
              </Label>
              <Input
                id="preferred-time-window"
                value={formData.preferred_time_window || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, preferred_time_window: e.target.value }))
                }
                placeholder={t('post.preferred_time_window_placeholder')}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}
