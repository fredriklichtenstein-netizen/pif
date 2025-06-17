
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, Flag } from "lucide-react";
import { Button } from "../ui/button";
import { useTranslation } from 'react-i18next';

interface CommentActionsProps {
  isCurrentUserAuthor: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onReport: () => void;
}

export function CommentActions({ 
  isCurrentUserAuthor, 
  onEdit, 
  onDelete, 
  onReport 
}: CommentActionsProps) {
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreHorizontal size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {isCurrentUserAuthor && (
          <>
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              {t('comments.edit')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              {t('comments.delete')}
            </DropdownMenuItem>
          </>
        )}
        {!isCurrentUserAuthor && (
          <DropdownMenuItem onClick={onReport}>
            <Flag className="mr-2 h-4 w-4" />
            {t('comments.report')}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
