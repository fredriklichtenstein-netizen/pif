
import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

interface RatingInputProps {
  onSubmit: (rating: number, comment?: string) => void;
  isSubmitting?: boolean;
  recipientName: string;
}

export function RatingInput({ onSubmit, isSubmitting = false, recipientName }: RatingInputProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const { t } = useTranslation();

  const ratingLabels = [
    t('interactions.rating_very_bad'),
    t('interactions.rating_bad'),
    t('interactions.rating_ok'),
    t('interactions.rating_good'),
    t('interactions.rating_excellent'),
  ];

  const handleSubmit = () => {
    if (rating > 0) {
      onSubmit(rating, comment.trim() || undefined);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t('interactions.rate_user', { name: recipientName })}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center space-y-2">
          <div className="flex space-x-1">
            {Array.from({ length: 5 }, (_, i) => (
              <button
                key={i}
                type="button"
                className="focus:outline-none"
                onMouseEnter={() => setHoverRating(i + 1)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(i + 1)}
              >
                <Star
                  className={`h-8 w-8 transition-colors ${
                    i < (hoverRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted-foreground hover:text-yellow-200'
                  }`}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-sm text-muted-foreground">
              {ratingLabels[rating - 1]}
            </p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium">{t('interactions.comment_optional')}</label>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t('interactions.write_comment_experience')}
            rows={3}
            className="mt-1"
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={rating === 0 || isSubmitting}
          className="w-full"
        >
          {isSubmitting ? t('interactions.submitting_rating') : t('interactions.submit_rating')}
        </Button>
      </CardContent>
    </Card>
  );
}
