import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AddressInput } from "./address/AddressInput";
import { Map } from "lucide-react";
import { useTranslation } from "react-i18next";

export interface PickupPreferencesData {
  pickupPreference?: 'meetup' | 'leave_at_door' | '';
  pickupAddress?: string;
  pickupAddressMode?: 'primary' | 'custom';
  pickupDoorCode?: string;
  pickupFloor?: string;
  pickupInstructions?: string;
}

interface PickupPreferencesFieldsProps {
  /** The profile's primary address, used to resolve the "use primary" pickup-address option. */
  primaryAddress: string;
  formData: PickupPreferencesData;
  onChange: (data: PickupPreferencesData) => void;
}

/**
 * Default pif hand-off preferences: how/where a piffer prefers to hand
 * items off, used to prefill new posts unless a specific post overrides
 * them. Shared between Profile Settings (ProfileForm) and the onboarding
 * wizard's optional pickup-preferences step.
 */
export function PickupPreferencesFields({ primaryAddress, formData, onChange }: PickupPreferencesFieldsProps) {
  const { t } = useTranslation();
  const handleChange = (updates: Partial<PickupPreferencesData>) => {
    onChange({ ...formData, ...updates });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2 pt-2">
        <Label>{t('profile.pickup_preference')}</Label>
        <RadioGroup
          value={formData.pickupPreference || ''}
          onValueChange={(value) =>
            handleChange({ pickupPreference: value as 'meetup' | 'leave_at_door' })
          }
          className="flex flex-col gap-2"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="meetup" id="pp-meetup" />
            <Label htmlFor="pp-meetup" className="font-normal cursor-pointer">
              {t('profile.pickup_meetup')}
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="leave_at_door" id="pp-leave" />
            <Label htmlFor="pp-leave" className="font-normal cursor-pointer">
              {t('profile.pickup_leave_at_door')}
            </Label>
          </div>
        </RadioGroup>
      </div>

      {formData.pickupPreference && (
        <PickupAddressSection
          primaryAddress={primaryAddress}
          mode={formData.pickupAddressMode || 'primary'}
          customAddress={formData.pickupAddress || ''}
          onModeChange={(mode) => {
            if (mode === 'primary') {
              handleChange({ pickupAddressMode: 'primary', pickupAddress: primaryAddress || '' });
            } else {
              handleChange({ pickupAddressMode: 'custom' });
            }
          }}
          onCustomAddressChange={(addr) =>
            handleChange({ pickupAddressMode: 'custom', pickupAddress: addr })
          }
        />
      )}

      <div className="space-y-2 pt-2">
        <Label htmlFor="pickup-door-code">{t('post.pickup_door_code')}</Label>
        <Input
          id="pickup-door-code"
          value={formData.pickupDoorCode || ''}
          onChange={(e) => handleChange({ pickupDoorCode: e.target.value })}
          placeholder={t('post.pickup_door_code_placeholder')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="pickup-floor">{t('post.pickup_floor')}</Label>
        <Input
          id="pickup-floor"
          type="number"
          inputMode="numeric"
          value={formData.pickupFloor || ''}
          onChange={(e) => handleChange({ pickupFloor: e.target.value })}
          placeholder={t('post.pickup_floor_placeholder')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="pickup-instructions">{t('post.pickup_instructions')}</Label>
        <Textarea
          id="pickup-instructions"
          value={formData.pickupInstructions || ''}
          onChange={(e) => handleChange({ pickupInstructions: e.target.value })}
          placeholder={t('post.pickup_instructions_placeholder')}
          className="min-h-[80px]"
        />
      </div>
    </div>
  );
}

interface PickupAddressSectionProps {
  primaryAddress: string;
  mode: 'primary' | 'custom';
  customAddress: string;
  onModeChange: (mode: 'primary' | 'custom') => void;
  onCustomAddressChange: (address: string) => void;
}

function PickupAddressSection({
  primaryAddress,
  mode,
  customAddress,
  onModeChange,
  onCustomAddressChange,
}: PickupAddressSectionProps) {
  const { t } = useTranslation();
  const resolved = mode === 'primary' ? primaryAddress : customAddress;

  return (
    <div className="space-y-3 pt-2">
      <Label>{t('profile.pickup_address')}</Label>
      <RadioGroup
        value={mode}
        onValueChange={(v) => onModeChange(v as 'primary' | 'custom')}
        className="flex flex-col gap-2"
      >
        <div className="flex items-center gap-2">
          <RadioGroupItem value="primary" id="pa-primary" />
          <Label htmlFor="pa-primary" className="font-normal cursor-pointer">
            {t('profile.pickup_use_primary')}
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="custom" id="pa-custom" />
          <Label htmlFor="pa-custom" className="font-normal cursor-pointer">
            {t('profile.pickup_use_other')}
          </Label>
        </div>
      </RadioGroup>

      {mode === 'primary' ? (
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
