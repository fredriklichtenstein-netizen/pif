import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2 } from "lucide-react";
import PostForm from "@/components/post/PostForm";
import { MainNav } from "@/components/MainNav";
import { MainHeader } from "@/components/layout/MainHeader";
import { useTranslation } from "react-i18next";
import { draftToInitialData, fetchDraft } from "@/services/drafts";
import { DRAFTS_FEED_PATH } from "@/lib/feedLinks";

function DraftEdit() {
  const { id } = useParams<{ id: string }>();
  const [initialData, setInitialData] = useState<ReturnType<typeof draftToInitialData> | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const draftId = Number(id);
    if (!Number.isInteger(draftId)) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    // Switching drafts from the form's drafts menu reuses this page.
    setLoading(true);
    setNotFound(false);
    setInitialData(null);
    let cancelled = false;
    // RLS returns nothing for someone else's draft, so "not yours" and
    // "doesn't exist" look the same -- intentionally.
    fetchDraft(draftId)
      .then((draft) => {
        if (cancelled) return;
        if (draft) setInitialData(draftToInitialData(draft));
        else setNotFound(true);
      })
      .catch((err) => {
        console.error("Error fetching draft:", err);
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="min-h-screen flex flex-col">
      <MainHeader />
      <div className="flex-1">
        {loading ? (
          <div className="container max-w-3xl mx-auto py-8 px-4 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : notFound || !initialData ? (
          <div className="container max-w-3xl mx-auto py-8 px-4">
            <Card className="p-8 flex flex-col items-center text-center">
              <AlertCircle className="text-destructive h-10 w-10 mb-4" />
              <h2 className="text-xl font-semibold mb-2">{t("drafts.not_found_title")}</h2>
              <p className="text-muted-foreground mb-4">{t("drafts.error_not_found")}</p>
              <Button asChild>
                <Link to={DRAFTS_FEED_PATH}>{t("drafts.back_to_drafts")}</Link>
              </Button>
            </Card>
          </div>
        ) : (
          <PostForm key={id} initialData={initialData} />
        )}
      </div>
      <MainNav />
    </div>
  );
}

export default DraftEdit;
