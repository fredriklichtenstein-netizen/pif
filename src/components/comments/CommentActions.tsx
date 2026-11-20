
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, Flag } from "lucide-react";
import { Button } from "../ui/button";
import { useTranslation } from 'react-i18next';
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { BlockUserMenuItem } from "@/components/blocking/BlockUserMenuItem";

interface CommentActionsProps {
  isCurrentUserAuthor: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onReport: () => void;
  authorId?: string;
  authorName?: string;
}

export function CommentActions({ 
  isCurrentUserAuthor, 
  onEdit, 
  onDelete, 
  onReport,
  authorId,
  authorName,
}: CommentActionsProps) {
  const { t } = useTranslation();
  const { session } = useGlobalAuth();
  const isAuthenticated = !!session?.user;

  // Hide the menu entirely for unauthenticated users — they have no
  // available actions (can't edit/delete others' comments, can't report).
  if (!isAuthenticated) return null;

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
          <>
            <DropdownMenuItem onClick={onReport}>
              <Flag className="mr-2 h-4 w-4" />
              {t('comments.report')}
            </DropdownMenuItem>
            <BlockUserMenuItem userId={authorId} name={authorName} />
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
