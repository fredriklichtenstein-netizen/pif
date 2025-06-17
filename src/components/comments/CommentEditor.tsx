
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

  return (
    <div className="mt-2 space-y-2">
      <Textarea
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        className="min-h-[60px]"
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={onSave}>{t('comments.save')}</Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onCancel}
        >
          {t('comments.cancel')}
        </Button>
      </div>
    </div>
  );
}
