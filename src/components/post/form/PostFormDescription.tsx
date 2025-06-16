
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useCallback } from "react";

interface PostFormDescriptionProps {
  description: string;
  onDescriptionChange: (description: string) => void;
  itemType?: 'offer' | 'request';
}

export function PostFormDescription({ 
  description, 
  onDescriptionChange,
  itemType = 'offer'
}: PostFormDescriptionProps) {
  const isRequest = itemType === 'request';
  
  const placeholder = isRequest 
    ? "Beskriv vad du söker och eventuella specifika krav eller önskemål..."
    : "Beskriv varan, dess skick och eventuella defekter...";
    
  const label = isRequest ? "Beskrivning av vad du söker *" : "Beskrivning *";

  // Enhanced change handler with immediate updates
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    console.log('Description input changed:', value);
    onDescriptionChange(value);
  }, [onDescriptionChange]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="description">{label}</Label>
        <Textarea
          id="description"
          value={description}
          onChange={handleChange}
          placeholder={placeholder}
          className="min-h-[120px]"
          required
        />
      </div>
      
      {isRequest && (
        <div className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">
          <p><strong>Tips:</strong> Var så specifik som möjligt om vad du söker. Detta hjälper andra att förstå om de har något som passar dina behov.</p>
        </div>
      )}
    </div>
  );
}
