
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PostFormSizeSelector } from "./PostFormSizeSelector";
import { Weight } from "lucide-react";
import type { CreatePostInput } from "@/types/post";
import { useTranslation } from 'react-i18next';

interface PostFormInformationProps {
  formData: CreatePostInput;
  setFormData: (formData: CreatePostInput | ((prev: CreatePostInput) => CreatePostInput)) => void;
  onMeasurementChange: (field: string, value: string) => void;
}

const CATEGORIES = [
  "electronics",
  "furniture", 
  "clothing",
  "books",
  "sports",
  "toys",
  "home_garden",
  "vehicles",
  "kitchen",
  "garden",
  "tools",
  "household",
  "food",
  "kids",
  "pets",
  "bicycle",
  "health",
  "art",
  "music",
  "mixed",
  "other"
];

const CONDITIONS = [
  { key: "new", value: "conditions.new" },
  { key: "like_new", value: "conditions.like_new" }, 
  { key: "very_good", value: "conditions.very_good" },
  { key: "good", value: "conditions.good" },
  { key: "acceptable", value: "conditions.acceptable" },
  { key: "poor", value: "conditions.poor" }
];

const REQUEST_CONDITIONS = [
  { key: "any_condition", value: "post.any_condition" },
  { key: "prefer_new", value: "post.prefer_new" },
  { key: "good_enough", value: "post.good_enough" },
  { key: "can_be_worn", value: "post.can_be_worn" }
];

const CATEGORY_MEASUREMENTS: { [key: string]: string[] } = {
  "clothing": ["Chest", "Length", "Shoulders", "Sleeves"],
  "shoes": ["EU Size", "US Size", "UK Size", "Insole Length"],
  "kids": ["Age", "Height", "Chest", "Length"],
  "furniture": ["Width", "Depth", "Height"],
};

export function PostFormInformation({
  formData,
  setFormData,
  onMeasurementChange,
}: PostFormInformationProps) {
  const { t } = useTranslation();
  const isRequest = formData.item_type === 'request';
  const conditions = isRequest ? REQUEST_CONDITIONS : CONDITIONS;
  const measurements = formData.measurements || {};

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, description: value }));
  };

  const handleSizeChange = (size: string) => {
    onMeasurementChange("size", size === "none" ? "" : size);
  };
  
  const handleCustomSizeChange = (customSize: string) => {
    onMeasurementChange("customSize", customSize);
    
    if (customSize && (!measurements.size || measurements.size === "none")) {
      onMeasurementChange("size", customSize);
    }
  };

  const showWeightField = !isRequest;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{t('post.step_information')}</h3>
        <p className="text-sm text-muted-foreground">
          {isRequest 
            ? t('post.information_request_description')
            : t('post.information_offer_description')
          }
        </p>
      </div>

      {/* Grundläggande information */}
      <div className="space-y-6">
        <div className="space-y-4">
          <h4 className="font-medium text-foreground">{t('post.basic_information')}</h4>
          
          {/* Titel */}
          <div className="space-y-2">
            <Label htmlFor="title">
              {isRequest ? t('post.title_request_label') : t('post.title_label')} *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder={isRequest ? t('post.title_request_placeholder') : t('post.title_placeholder')}
              required
            />
          </div>

          {/* Kategori */}
          <div className="space-y-2">
            <Label htmlFor="category">{t('post.category')} *</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('post.select_category')} />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {t(`categories.${category.toLowerCase().replace(/\s+/g, '_').replace('&', '').replace(/'/g, '')}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Skick */}
          <div className="space-y-2">
            <Label htmlFor="condition">
              {isRequest ? t('post.condition_request') : t('post.condition')} *
            </Label>
            <Select 
              value={formData.condition} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, condition: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder={isRequest ? t('post.select_desired_condition') : t('post.select_condition')} />
              </SelectTrigger>
              <SelectContent>
                {conditions.map((condition) => (
                  <SelectItem key={condition.key} value={condition.key}>
                    {t(condition.value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Beskrivning */}
        <div className="space-y-4">
          <h4 className="font-medium text-foreground">{t('post.description')}</h4>
          
          <div className="space-y-2">
            <Label htmlFor="description">
              {isRequest ? t('post.description_request') : t('post.description')} *
            </Label>
            <Textarea
              id="description"
              value={formData.description || ""}
              onChange={handleDescriptionChange}
              placeholder={isRequest 
                ? t('post.description_request_placeholder')
                : t('post.description_placeholder')
              }
              className="min-h-[120px]"
              required
            />
          </div>
          
          {isRequest && (
            <div className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">
              <p><strong>{t('post.tip_label')}</strong> {t('post.request_description_tip')}</p>
            </div>
          )}
        </div>

        {/* Storlek och mått */}
        <div className="space-y-4">
          <h4 className="font-medium text-foreground">
            {isRequest ? t('post.size_preferences') : t('common.size_measurements')}
          </h4>

          {/* Storlek för kläder */}
          {formData.category?.toLowerCase().includes("clothing") && (
            <PostFormSizeSelector 
              category={formData.category} 
              measurements={measurements} 
              onSizeChange={handleSizeChange}
              onCustomSizeChange={handleCustomSizeChange}
              itemType={formData.item_type}
            />
          )}
          
          {/* Detaljerade mått för erbjudanden */}
          {!isRequest && formData.category && CATEGORY_MEASUREMENTS[formData.category] && (
            <div className="space-y-4">
              <Label className="text-sm font-medium">{t('post.detailed_measurements')}</Label>
              <div className="grid grid-cols-2 gap-4">
                {CATEGORY_MEASUREMENTS[formData.category].map((field) => (
                  <div key={field} className="space-y-2">
                    <Label className="text-sm text-gray-600">{field}</Label>
                    <Input
                      value={measurements[field] || ""}
                      onChange={(e) => onMeasurementChange(field, e.target.value)}
                      placeholder={field}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preferenser för önskningar */}
          {isRequest && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('post.other_preferences')}</Label>
              <Input
                value={measurements.preferences || ""}
                onChange={(e) => onMeasurementChange("preferences", e.target.value)}
                placeholder={t('post.preferences_placeholder')}
              />
              <p className="text-xs text-muted-foreground">
                {t('post.preferences_description')}
              </p>
            </div>
          )}
          
          {/* Vikt endast för erbjudanden */}
          {showWeightField && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Weight className="h-4 w-4 text-gray-500" />
                <Label className="text-sm font-medium">{t('post.weight')}</Label>
              </div>
              <Input
                value={measurements.weight || ""}
                onChange={(e) => onMeasurementChange("weight", e.target.value)}
                placeholder={t('post.weight_placeholder')}
                className="max-w-[200px]"
              />
            </div>
          )}

          {/* Tips */}
          <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg">
            <p>
              <strong>{t('post.tip_icon')} {t('post.tip_label')}</strong> {isRequest
                ? t('post.information_tip_request')
                : t('post.information_tip_offer')
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
