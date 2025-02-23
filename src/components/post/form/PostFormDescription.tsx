
import { Textarea } from "@/components/ui/textarea";

interface PostFormDescriptionProps {
  description: string;
  onDescriptionChange: (value: string) => void;
}

export function PostFormDescription({
  description,
  onDescriptionChange,
}: PostFormDescriptionProps) {
  return (
    <div className="space-y-2">
      <label htmlFor="description" className="text-sm font-medium">
        Description
      </label>
      <Textarea
        id="description"
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        placeholder="Share any additional details about your item that might be helpful for others to know."
        required
      />
    </div>
  );
}
