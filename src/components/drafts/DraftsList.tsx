import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { AlertCircle, CalendarClock, FileText, Loader2, Pencil, Send, Trash2, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useMyDrafts } from "@/hooks/drafts/useMyDrafts";
import { ScheduleDialog } from "@/components/drafts/ScheduleDialog";
import { formatScheduleTime } from "@/lib/schedule";
import { clearPostsCache } from "@/services/posts/optimized";
import {
  DRAFT_RETENTION_DAYS,
  DRAFTS_QUERY_KEY,
  deleteDraft,
  draftErrorKey,
  draftMissingFields,
  publishDraft,
  setDraftSchedule,
  type ItemDraft,
} from "@/services/drafts";
import { feedPostPath } from "@/lib/feedLinks";

/**
 * The user's drafts and scheduled posts. Rendered as the feed's drafts view
 * (/feed?view=drafts) -- drafts live in item_drafts, not items, so they
 * get their own cards rather than FeedItemCard.
 */
export function DraftsList() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: drafts, isLoading, error } = useMyDrafts();
  const [busyId, setBusyId] = useState<number | null>(null);
  const [scheduling, setScheduling] = useState<ItemDraft | null>(null);
  const [deleting, setDeleting] = useState<ItemDraft | null>(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: DRAFTS_QUERY_KEY });

  const run = async (draft: ItemDraft, action: () => Promise<void>, successTitle: string) => {
    setBusyId(draft.id);
    try {
      await action();
      toast({ title: successTitle });
      await refresh();
      return true;
    } catch (err) {
      console.error("Draft action failed:", err);
      const key = draftErrorKey(err);
      toast({
        title: t("post.error"),
        description: key ? t(key) : t("drafts.error_saving"),
        variant: "destructive",
      });
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const handlePublish = async (draft: ItemDraft) => {
    let itemId: number | null = null;
    const ok = await run(
      draft,
      async () => {
        itemId = await publishDraft(draft.id);
        clearPostsCache();
        await queryClient.invalidateQueries({ queryKey: ["posts"] });
      },
      draft.item_type === "request" ? t("post.request_created") : t("post.pif_created"),
    );
    if (ok && itemId) navigate(feedPostPath(itemId));
  };

  const handleSchedule = async (date: Date) => {
    if (!scheduling) return;
    const draft = scheduling;
    const ok = await run(
      draft,
      () => setDraftSchedule(draft.id, date),
      t("drafts.scheduled_toast"),
    );
    if (ok) setScheduling(null);
  };

  const handleUnschedule = (draft: ItemDraft) =>
    run(draft, () => setDraftSchedule(draft.id, null), t("drafts.unscheduled_toast"));

  const handleDelete = async () => {
    if (!deleting) return;
    const draft = deleting;
    setDeleting(null);
    await run(draft, () => deleteDraft(draft), t("drafts.deleted_toast"));
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">{t("drafts.page_title")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("drafts.retention_note", { days: DRAFT_RETENTION_DAYS })}
        </p>
      </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <Card className="p-6 text-center text-destructive">{t("drafts.load_error")}</Card>
        ) : !drafts || drafts.length === 0 ? (
          <Card className="p-8 flex flex-col items-center text-center">
            <FileText className="h-12 w-12 mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">{t("drafts.empty_title")}</h3>
            <p className="text-sm text-muted-foreground mb-4">{t("drafts.empty_description")}</p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild>
                <Link to="/post?type=offer">{t("post.create_offer")}</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/post?type=request">{t("post.create_request")}</Link>
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {drafts.map((draft) => {
              const missing = draftMissingFields(draft);
              const complete = missing.length === 0;
              const busy = busyId === draft.id;
              const scheduledAt = draft.scheduled_at ? new Date(draft.scheduled_at) : null;
              return (
                <Card key={draft.id} className="p-4">
                  <div className="flex gap-3">
                    <Link to={`/post/draft/${draft.id}`} className="shrink-0">
                      {draft.images?.[0] ? (
                        <img
                          src={draft.images[0]}
                          alt=""
                          className="h-20 w-20 rounded-md object-cover bg-muted"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-20 w-20 rounded-md bg-muted flex items-center justify-center">
                          <FileText className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <Badge variant="outline">
                          {draft.item_type === "request" ? t("drafts.type_request") : t("drafts.type_offer")}
                        </Badge>
                        {scheduledAt ? (
                          <Badge className="gap-1">
                            <CalendarClock className="h-3 w-3" />
                            {t("drafts.badge_scheduled", { when: formatScheduleTime(scheduledAt, i18n.language) })}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">{t("drafts.badge_draft")}</Badge>
                        )}
                      </div>
                      <Link
                        to={`/post/draft/${draft.id}`}
                        className="block font-semibold truncate hover:underline"
                      >
                        {draft.title?.trim() || t("drafts.untitled")}
                      </Link>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t("drafts.last_edited", {
                          when: new Date(draft.updated_at).toLocaleDateString(i18n.language === "en" ? "en-GB" : "sv-SE"),
                        })}
                      </p>
                      {!complete && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {t("drafts.missing", {
                            fields: missing.map((f) => t(`drafts.field_${f}`)).join(", "),
                          })}
                        </p>
                      )}
                    </div>
                  </div>

                  {draft.publish_error && !scheduledAt && (
                    <div className="mt-3 flex items-start gap-2 rounded-md bg-destructive/10 p-2 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>{t("drafts.publish_failed")}</span>
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/post/draft/${draft.id}`}>
                        <Pencil className="h-4 w-4 mr-1.5" />
                        {t("drafts.edit")}
                      </Link>
                    </Button>
                    <Button size="sm" onClick={() => handlePublish(draft)} disabled={!complete || busy}>
                      <Send className="h-4 w-4 mr-1.5" />
                      {t("drafts.publish_now")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setScheduling(draft)}
                      disabled={!complete || busy}
                    >
                      <CalendarClock className="h-4 w-4 mr-1.5" />
                      {scheduledAt ? t("drafts.change_schedule") : t("drafts.schedule_button")}
                    </Button>
                    {scheduledAt && (
                      <Button size="sm" variant="ghost" onClick={() => handleUnschedule(draft)} disabled={busy}>
                        <X className="h-4 w-4 mr-1.5" />
                        {t("drafts.unschedule")}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleting(draft)}
                      disabled={busy}
                    >
                      <Trash2 className="h-4 w-4 mr-1.5" />
                      {t("drafts.delete")}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

      <ScheduleDialog
        open={!!scheduling}
        onOpenChange={(open) => !open && setScheduling(null)}
        initial={scheduling?.scheduled_at ? new Date(scheduling.scheduled_at) : null}
        isSubmitting={busyId !== null}
        onConfirm={handleSchedule}
      />

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("drafts.delete_confirm_title")}</AlertDialogTitle>
            <AlertDialogDescription>{t("drafts.delete_confirm_message")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("post.cancel_button")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("drafts.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
