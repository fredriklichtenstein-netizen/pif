
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";

interface CommentEditorProps {
  text: string;
  onTextChange: (text: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function CommentEditor({
  text,
  onTextChange,
  onSave,
  onCancel
}: CommentEditorProps) {
  return (
    <div className="mt-2 space-y-2">
      <Textarea
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        className="min-h-[60px]"
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={onSave}>Save</Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
