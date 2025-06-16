
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Gift, Search } from "lucide-react";
import { useTranslation } from 'react-i18next';

interface PostFormStepsProps {
  formData: any;
  setFormData: (data: any) => void;
}

export function PostFormSteps({ formData, setFormData }: PostFormStepsProps) {
  const { t } = useTranslation();
  
  const handleItemTypeChange = (value: 'offer' | 'request') => {
    setFormData({ ...formData, item_type: value });
  };

  return (
    <div className="space-y-6">
      {/* Step 1: Välj typ av PIF */}
      <Card className="border-2 border-primary/20">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-center">{t('post.what_do_you_want')}</h3>
          <RadioGroup
            value={formData.item_type || 'offer'}
            onValueChange={handleItemTypeChange}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {/* Piffa (Erbjud) */}
            <div className="flex items-center space-x-2 p-4 border-2 border-primary/30 rounded-lg hover:border-primary/60 transition-colors cursor-pointer">
              <RadioGroupItem value="offer" id="offer" />
              <Label htmlFor="offer" className="flex items-center space-x-3 cursor-pointer w-full">
                <div className="bg-primary/10 p-3 rounded-full">
                  <Gift className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-primary">{t('post.offer_action')}</h4>
                  <p className="text-sm text-muted-foreground">{t('post.offer_description')}</p>
                </div>
              </Label>
            </div>

            {/* Önska (Efterfråga) */}
            <div className="flex items-center space-x-2 p-4 border-2 border-secondary/30 rounded-lg hover:border-secondary/60 transition-colors cursor-pointer">
              <RadioGroupItem value="request" id="request" />
              <Label htmlFor="request" className="flex items-center space-x-3 cursor-pointer w-full">
                <div className="bg-secondary/10 p-3 rounded-full">
                  <Search className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <h4 className="font-medium text-secondary">{t('post.request_action')}</h4>
                  <p className="text-sm text-muted-foreground">{t('post.request_description')}</p>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  );
}
