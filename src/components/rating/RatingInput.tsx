
import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RatingInputProps {
  onSubmit: (rating: number, comment?: string) => void;
  isSubmitting?: boolean;
  recipientName: string;
}

export function RatingInput({ onSubmit, isSubmitting = false, recipientName }: RatingInputProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");

  const handleSubmit = () => {
    if (rating > 0) {
      onSubmit(rating, comment.trim() || undefined);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Betygsätt {recipientName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Star rating */}
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
                      : 'text-gray-300 hover:text-yellow-200'
                  }`}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-sm text-muted-foreground">
              {rating === 1 && "Mycket dåligt"}
              {rating === 2 && "Dåligt"}
              {rating === 3 && "Okej"}
              {rating === 4 && "Bra"}
              {rating === 5 && "Utmärkt"}
            </p>
          )}
        </div>

        {/* Comment */}
        <div>
          <label className="text-sm font-medium">Kommentar (valfritt)</label>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Skriv en kommentar om din upplevelse..."
            rows={3}
            className="mt-1"
          />
        </div>

        {/* Submit button */}
        <Button
          onClick={handleSubmit}
          disabled={rating === 0 || isSubmitting}
          className="w-full"
        >
          {isSubmitting ? "Skickar..." : "Skicka betyg"}
        </Button>
      </CardContent>
    </Card>
  );
}
