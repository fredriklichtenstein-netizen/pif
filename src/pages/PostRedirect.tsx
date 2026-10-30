import { Navigate, useLocation, useParams } from "react-router-dom";
import { feedPostPath } from "@/lib/feedLinks";

/**
 * /item/<id> and /share/<id>: posts are shown where they sit in the feed,
 * so these old addresses (emails, notifications, bookmarks, the sitemap,
 * search results) redirect there, keeping query params like ?comment=.
 * The standalone item page was removed 2026-10-30.
 */
export default function PostRedirect() {
  const { id } = useParams();
  const { search } = useLocation();
  return <Navigate to={id ? feedPostPath(id, search) : "/feed"} replace />;
}
