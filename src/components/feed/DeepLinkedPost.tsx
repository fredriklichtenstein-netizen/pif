import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FeedItemList } from "./FeedItemList";
import { FeedSkeleton } from "./FeedSkeleton";
import { getPostById } from "@/services/posts/optimized";
import type { Post } from "@/types/post";

interface DeepLinkedPostProps {
  postId: string;
  isLoggedIn: boolean;
  onDismiss: () => void;
}

/**
 * A /feed?post=<id> target the feed couldn't show where it sits -- archived
 * for a logged-out viewer (the archived view needs an account), too far
 * down, or gone. Shown pinned above the feed; this replaced the old
 * standalone /item/<id> page as the fallback.
 */
export function DeepLinkedPost({ postId, isLoggedIn, onDismiss }: DeepLinkedPostProps) {
  const { t } = useTranslation();
  const [state, setState] = useState<{ status: "loading" | "found" | "missing"; post?: Post }>({
    status: "loading",
  });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });
    getPostById(postId, isLoggedIn)
      .then((post) => {
        if (!cancelled) setState(post ? { status: "found", post } : { status: "missing" });
      })
      .catch((err) => {
        console.error("Could not load linked post:", err);
        if (!cancelled) setState({ status: "missing" });
      });
    return () => {
      cancelled = true;
    };
  }, [postId, isLoggedIn]);

  if (state.status === "loading") return <FeedSkeleton count={1} />;

  if (state.status === "missing") {
    return (
      <Alert className="flex items-start gap-2">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex-1">{t("feed.linked_post_missing")}</AlertDescription>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={onDismiss}
          aria-label={t("feed.linked_post_dismiss")}
        >
          <X className="h-4 w-4" />
        </Button>
      </Alert>
    );
  }

  return (
    <section aria-label={t("feed.linked_post_label")} className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{t("feed.linked_post_pinned")}</p>
        <Button type="button" variant="ghost" size="sm" onClick={onDismiss}>
          <X className="h-4 w-4 mr-1" />
          {t("feed.linked_post_dismiss")}
        </Button>
      </div>
      <FeedItemList
        posts={[state.post]}
        selectedCategories={[]}
        clearFilters={() => {}}
        viewMode="all"
        scrollToPostId={postId}
      />
    </section>
  );
}
