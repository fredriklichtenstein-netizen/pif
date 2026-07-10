
import React, { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { AddressInput } from "@/components/profile/address/AddressInput";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, Handshake, DoorOpen, Sparkles, Map, Wand2 } from "lucide-react";
import type { PostFormData, PickupProfileDefaults } from "@/types/post";
import { useTranslation } from 'react-i18next';
import { cn } from "@/lib/utils";
import { PostFieldError } from "./PostFieldError";

interface PostFormLocationProps {
  formData: PostFormData;
  setFormData: (formData: PostFormData | ((prev: PostFormData) => PostFormData)) => void;
  onAddressSelect?: (address: string, coordinates: { lat: number; lng: number }) => void;
  fieldErrors?: Partial<Record<string, string>>;
  profileDefaults?: PickupProfileDefaults;
  isEditMode?: boolean;
}

type PickupOption = 'meetup' | 'leave_at_door' | 'flexible';

type PickupField = 'address' | 'door_code' | 'floor' | 'instructions' | 'phone';

const EMPTY_DEFAULTS: PickupProfileDefaults = {
  pickup_address: "",
  pickup_door_code: "",
  pickup_floor: "",
  pickup_instructions: "",
  phone: "",
  primary_address: "",
};

export function PostFormLocation({
  formData,
  setFormData,
  onAddressSelect,
  fieldErrors = {},
  profileDefaults = EMPTY_DEFAULTS,
  isEditMode = false,
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

  // Per-field opt-in toggles. In edit mode we auto-enable any field that
  // already has a saved value on the item so nothing appears cleared.
  const [enabledFields, setEnabledFields] = useState<Record<PickupField, boolean>>(() => ({
    address: isEditMode && !!(formData.pickup_address && formData.pickup_address.length > 0),
    door_code: isEditMode && !!(formData.pickup_door_code && formData.pickup_door_code.length > 0),
    floor: isEditMode && !!(formData.pickup_floor && formData.pickup_floor.length > 0),
    instructions: isEditMode && !!(formData.pickup_instructions && formData.pickup_instructions.length > 0),
    phone: isEditMode && !!(formData.phone && formData.phone.length > 0),
  }));

  // The default value we'd populate for each field when the toggle flips on
  // (or the "use my defaults" button is tapped).
  const defaultsMap: Record<PickupField, string> = {
    address: profileDefaults.pickup_address || profileDefaults.primary_address || '',
    door_code: profileDefaults.pickup_door_code || '',
    floor: profileDefaults.pickup_floor || '',
    instructions: profileDefaults.pickup_instructions || '',
    phone: profileDefaults.phone || '',
  };
  const hasDefault = (f: PickupField) => defaultsMap[f].length > 0;
  const anyDefault = (Object.keys(defaultsMap) as PickupField[]).some(hasDefault);

  const clearField = (f: PickupField) => {
    setFormData((prev) => {
      switch (f) {
        case 'address': return { ...prev, pickup_address: '' };
        case 'door_code': return { ...prev, pickup_door_code: '' };
        case 'floor': return { ...prev, pickup_floor: '' };
        case 'instructions': return { ...prev, pickup_instructions: '' };
        case 'phone': return { ...prev, phone: '' };
      }
    });
  };

  const populateField = (f: PickupField) => {
    const val = defaultsMap[f];
    if (!val) return;
    setFormData((prev) => {
      switch (f) {
        case 'address': {
          // If the profile has a distinct saved pickup_address, mark mode as custom.
          const savedPickup = profileDefaults.pickup_address;
          const primary = profileDefaults.primary_address;
          const mode = savedPickup && savedPickup !== primary ? 'custom' : 'primary';
          return { ...prev, pickup_address: val, pickup_address_mode: mode };
        }
        case 'door_code': return { ...prev, pickup_door_code: val };
        case 'floor': return { ...prev, pickup_floor: val };
        case 'instructions': return { ...prev, pickup_instructions: val };
        case 'phone': return { ...prev, phone: val };
      }
    });
  };

  const toggleField = (f: PickupField, on: boolean) => {
    setEnabledFields((prev) => ({ ...prev, [f]: on }));
    // Never auto-populate from profile defaults on individual toggle.
    // Only `applyDefaults()` (the "Use my defaults" button) reads defaultsMap.
    // ON reveals an empty editable input; OFF clears the field.
    clearField(f);
  };

  const applyDefaults = () => {
    const next = { ...enabledFields };
    (Object.keys(defaultsMap) as PickupField[]).forEach((f) => {
      if (hasDefault(f)) {
        next[f] = true;
        populateField(f);
      }
    });
    setEnabledFields(next);
  };

  const clearAll = () => {
    setEnabledFields({
      address: false, door_code: false, floor: false, instructions: false, phone: false,
    });
    setFormData((prev) => ({
      ...prev,
      pickup_address: '',
      pickup_address_mode: 'primary',
      pickup_door_code: '',
      pickup_floor: '',
      pickup_instructions: '',
      phone: '',
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
            : t('post.location_question')
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
          <PostFieldError message={fieldErrors.location} />
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
          <Collapsible defaultOpen={!!formData.pickup_preference} className="border rounded-lg">
            <CollapsibleTrigger className="flex w-full items-center justify-between p-4 text-sm font-medium hover:bg-muted/30 transition-colors">
              <span>{t('post.pickup_details_optional')}</span>
              <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="p-4 pt-0 space-y-5">
              <div className="text-sm bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-lg">
                <p className="font-medium">{t('post.pickup_share_notice_title')}</p>
                <p className="mt-1">{t('post.pickup_share_notice_body')}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={applyDefaults}
                  disabled={!anyDefault}
                  className="w-full justify-center gap-2"
                >
                  <Wand2 className="h-4 w-4" />
                  {t('post.use_my_defaults')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={clearAll}
                  className="w-full justify-center gap-2"
                >
                  {t('post.clear_all_fields')}
                </Button>
              </div>


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

              <PickupFieldRow
                label={t('profile.pickup_address')}
                enabled={enabledFields.address}
                hasDefault={hasDefault('address')}
                onToggle={(on) => toggleField('address', on)}
              >
                <PostPickupAddressSection
                  primaryAddress={formData.primary_address || profileDefaults.primary_address || ''}
                  mode={(formData.pickup_address_mode as 'primary' | 'custom') || 'primary'}
                  customAddress={formData.pickup_address || ''}
                  onModeChange={(mode) =>
                    setFormData((prev) => ({
                      ...prev,
                      pickup_address_mode: mode,
                      pickup_address:
                        mode === 'primary'
                          ? prev.primary_address || ''
                          : prev.pickup_address || '',
                    }))
                  }
                  onCustomAddressChange={(addr) =>
                    setFormData((prev) => ({ ...prev, pickup_address: addr }))
                  }
                />
              </PickupFieldRow>

              <PickupFieldRow
                label={t('post.pickup_door_code')}
                enabled={enabledFields.door_code}
                hasDefault={hasDefault('door_code')}
                onToggle={(on) => toggleField('door_code', on)}
              >
                <Input
                  id="pickup-door-code"
                  value={formData.pickup_door_code || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, pickup_door_code: e.target.value }))
                  }
                  placeholder={t('post.pickup_door_code_placeholder')}
                />
              </PickupFieldRow>

              <PickupFieldRow
                label={t('post.pickup_floor')}
                enabled={enabledFields.floor}
                hasDefault={hasDefault('floor')}
                onToggle={(on) => toggleField('floor', on)}
              >
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
              </PickupFieldRow>

              <PickupFieldRow
                label={t('post.pickup_instructions')}
                enabled={enabledFields.instructions}
                hasDefault={hasDefault('instructions')}
                onToggle={(on) => toggleField('instructions', on)}
              >
                <Textarea
                  id="pickup-instructions"
                  value={formData.pickup_instructions || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, pickup_instructions: e.target.value }))
                  }
                  placeholder={t('post.pickup_instructions_placeholder')}
                  className="min-h-[80px]"
                />
              </PickupFieldRow>

              <PickupFieldRow
                label={t('post.pickup_phone')}
                enabled={enabledFields.phone}
                hasDefault={hasDefault('phone')}
                onToggle={(on) => toggleField('phone', on)}
              >
                <Input
                  id="pickup-phone"
                  type="tel"
                  inputMode="tel"
                  value={formData.phone || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder={t('post.pickup_phone_placeholder')}
                />
              </PickupFieldRow>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </div>
  );
}

interface PickupFieldRowProps {
  label: string;
  enabled: boolean;
  hasDefault?: boolean;
  onToggle: (on: boolean) => void;
  children: React.ReactNode;
}

function PickupFieldRow({ label, enabled, onToggle, children }: PickupFieldRowProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <Label>{label}</Label>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={onToggle}
          aria-label={label}
        />
      </div>
      {enabled && <div className="pt-1">{children}</div>}
    </div>
  );
}


interface PostPickupAddressSectionProps {
  primaryAddress: string;
  mode: 'primary' | 'custom';
  customAddress: string;
  onModeChange: (mode: 'primary' | 'custom') => void;
  onCustomAddressChange: (address: string) => void;
}

function PostPickupAddressSection({
  primaryAddress,
  mode,
  customAddress,
  onModeChange,
  onCustomAddressChange,
}: PostPickupAddressSectionProps) {
  const { t } = useTranslation();
  const hasPrimary = !!primaryAddress;
  const effectiveMode = hasPrimary ? mode : 'custom';
  const resolved = effectiveMode === 'primary' ? primaryAddress : customAddress;

  return (
    <div className="space-y-3">
      {hasPrimary && (
        <RadioGroup
          value={mode}
          onValueChange={(v) => onModeChange(v as 'primary' | 'custom')}
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
      )}

      {effectiveMode === 'primary' ? (
        <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
          {primaryAddress || t('profile.pickup_no_primary')}
        </div>
      ) : (
        <AddressInput
          value={customAddress}
          onChange={(addr) => onCustomAddressChange(addr)}
          mapButtonLabel={<Map className="w-4 h-4" />}
          hideSearch
        />

      )}

      <p className="text-xs text-muted-foreground">
        {t('profile.pickup_address_in_use')}:{' '}
        <span className="font-medium text-foreground">
          {resolved || t('profile.pickup_no_address_set')}
        </span>
      </p>
    </div>
  );
}

