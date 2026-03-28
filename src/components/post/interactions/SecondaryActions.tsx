
import React from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ReportDialog } from "./ReportDialog";
import { BookmarkPlus, BookmarkCheck, Flag } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "react-i18next";

interface SecondaryActionsProps {
  isBookmarked: boolean;
  isOwner?: boolean;
  onBookmarkToggle: () => void;
  onReport: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function SecondaryActions({ isBookmarked, isOwner = false, onBookmarkToggle, onReport, onEdit, onDelete }: SecondaryActionsProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleReportClick = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: t('interactions.auth_required_title'),
        description: t('interactions.auth_required_report'),
        variant: "destructive",
        action: (<Button variant="outline" size="sm" onClick={() => navigate("/auth")}>{t('interactions.sign_in')}</Button>),
      });
      return;
    }
    onReport();
  };

  const handleBookmarkClick = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: t('interactions.auth_required_title'),
        description: t('interactions.auth_required_save'),
        variant: "destructive",
        action: (<Button variant="outline" size="sm" onClick={() => navigate("/auth")}>{t('interactions.sign_in')}</Button>),
      });
      return;
    }
    onBookmarkToggle();
  };

  return (
    <div className="flex items-center gap-2">
      <ReportDialog onReport={onReport} />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">{t('interactions.more')}</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!isOwner && (
            <DropdownMenuItem onClick={handleBookmarkClick}>
              {isBookmarked ? (<><BookmarkCheck className="mr-2 h-4 w-4" /><span>{t('interactions.unsave')}</span></>) : (<><BookmarkPlus className="mr-2 h-4 w-4" /><span>{t('interactions.save')}</span></>)}
            </DropdownMenuItem>
          )}
          {isOwner && (
            <>
              {onEdit && (<DropdownMenuItem onClick={onEdit}><span>{t('interactions.edit')}</span></DropdownMenuItem>)}
              {onDelete && (<DropdownMenuItem onClick={onDelete} className="text-destructive"><span>{t('interactions.delete')}</span></DropdownMenuItem>)}
            </>
          )}
          {!isOwner && (
            <DropdownMenuItem onClick={handleReportClick} className="text-destructive">
              <Flag className="mr-2 h-4 w-4" /><span>{t('interactions.report')}</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
