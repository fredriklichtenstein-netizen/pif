
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AddressInput } from "@/components/profile/address/AddressInput";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, Handshake, DoorOpen, Sparkles } from "lucide-react";
import type { PostFormData } from "@/types/post";
import { useTranslation } from 'react-i18next';
import { cn } from "@/lib/utils";

interface PostFormLocationProps {
  formData: PostFormData;
  setFormData: (formData: PostFormData | ((prev: PostFormData) => PostFormData)) => void;
  onAddressSelect?: (address: string, coordinates: { lat: number; lng: number }) => void;
}

type PickupOption = 'meetup' | 'leave_at_door' | 'flexible';

export function PostFormLocation({
  formData,
  setFormData,
  onAddressSelect,
}: PostFormLocationProps) {
  const { t } = useTranslation();
  const isRequest = formData.item_type === 'request';

  const pickupOptions: { value: PickupOption; label: string; icon: React.ElementType }[] = [
    { value: 'meetup', label: t('post.pickup_meetup'), icon: Handshake },
    { value: 'leave_at_door', label: t('post.pickup_leave_at_door'), icon: DoorOpen },
    { value: 'flexible', label: t('post.pickup_flexible'), icon: Sparkles },
  ];

  const selectedPref = formData.pickup_preference as PickupOption | '' | undefined;

  const selectPref = (value: PickupOption) => {
    setFormData((prev) => ({
      ...prev,
      pickup_preference: prev.pickup_preference === value ? '' : value,
    }));
  };

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

        {!isRequest && (
          <Collapsible className="border rounded-lg">
            <CollapsibleTrigger className="flex w-full items-center justify-between p-4 text-sm font-medium hover:bg-muted/30 transition-colors">
              <span>{t('post.pickup_details_optional')}</span>
              <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="p-4 pt-0 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {pickupOptions.map(({ value, label, icon: Icon }) => {
                  const active = selectedPref === value;
                  return (
                    <Button
                      key={value}
                      type="button"
                      variant={active ? "default" : "outline"}
                      onClick={() => selectPref(value)}
                      className={cn(
                        "h-auto min-h-[64px] py-3 px-3 flex flex-col items-center justify-center gap-1.5 text-center whitespace-normal",
                        active && "ring-2 ring-primary"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-sm font-medium leading-tight">{label}</span>
                    </Button>
                  );
                })}
              </div>

              <div className="space-y-2">
                <Label htmlFor="pickup-door-code">{t('post.pickup_door_code')}</Label>
                <Input
                  id="pickup-door-code"
                  value={formData.pickup_door_code || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, pickup_door_code: e.target.value }))
                  }
                  placeholder={t('post.pickup_door_code_placeholder')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pickup-floor">{t('post.pickup_floor')}</Label>
                <Input
                  id="pickup-floor"
                  type="number"
                  inputMode="numeric"
                  value={formData.pickup_floor || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, pickup_floor: e.target.value }))
                  }
                  placeholder={t('post.pickup_floor_placeholder')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pickup-instructions">
                  {t('post.pickup_instructions')}
                </Label>
                <Textarea
                  id="pickup-instructions"
                  value={formData.pickup_instructions || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, pickup_instructions: e.target.value }))
                  }
                  placeholder={t('post.pickup_instructions_placeholder')}
                  className="min-h-[80px]"
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </div>
  );
}
