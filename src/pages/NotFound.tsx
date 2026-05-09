import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RefreshCw, Search, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const hashParams = new URLSearchParams(location.hash.substring(1));
  const authError = hashParams.get("error");
  const errorCode = hashParams.get("error_code");
  const errorDescription = hashParams.get("error_description");

  const referrer = typeof document !== "undefined" ? document.referrer : "";
  const fromState = location.state as {
    from?: string;
    itemId?: string;
    error?: string;
  } | null;

  const fromPath = fromState?.from || "unknown";
  const itemId = fromState?.itemId || "none";
  const errorMsg = fromState?.error || "unknown";

  // The full URL the user actually landed on — this is the single most
  // useful piece of information for tracking down bad CTAs and copy/link
  // mismatches, so we surface it prominently in the UI and the log.
  const fullUrl =
    typeof window !== "undefined" ? window.location.href : location.pathname;

  const diagnostics = useMemo(
    () => ({
      type: authError ? "auth_error" : "404_error",
      url: fullUrl,
      path: location.pathname,
      search: location.search,
      hash: location.hash,
      referrer,
      fromPath,
      itemId,
      errorMsg,
      authError,
      errorCode,
      errorDescription,
      state: location.state,
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
      isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
      timestamp: new Date().toISOString(),
    }),
    [
      authError,
      errorCode,
      errorDescription,
      fromPath,
      fullUrl,
      itemId,
      errorMsg,
      location.hash,
      location.pathname,
      location.search,
      location.state,
      referrer,
    ],
  );

  useEffect(() => {
    // Single grouped log so it's easy to scan in the console — the URL
    // is the headline, full diagnostics are nested below.
    const label = authError
      ? `🔐 Auth error at ${fullUrl}`
      : `🔎 404 at ${fullUrl}`;
    // eslint-disable-next-line no-console
    console.error(label, diagnostics);

    try {
      const errorLog = JSON.parse(
        localStorage.getItem("pif_error_log") || "[]",
      );
      errorLog.push(diagnostics);
      while (errorLog.length > 10) errorLog.shift();
      localStorage.setItem("pif_error_log", JSON.stringify(errorLog));
    } catch (err) {
      console.error("Failed to log error to localStorage:", err);
    }
  }, [authError, diagnostics, fullUrl]);

  const handleRetryShareLink = () => {
    if (fromPath === "share" && itemId !== "none") {
      navigate(`/share/${itemId}`, { replace: true });
    }
  };

  const handleCopyDetails = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(diagnostics, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore — clipboard may be blocked
    }
  };

  const getErrorMessage = () => {
    if (errorCode === "otp_expired") return t("not_found.otp_expired");
    if (fromPath === "share" || fromPath === "item") {
      if (errorMsg === "Invalid item ID format - not a number") {
        return t("not_found.invalid_item_id");
      }
      if (errorMsg?.includes("Database error")) {
        return t("not_found.database_error");
      }
      return t("not_found.item_not_found_detail", { itemId });
    }
    return errorDescription
      ? decodeURIComponent(errorDescription.replace(/\+/g, " "))
      : t("not_found.page_doesnt_exist");
  };

  const handleReturnToAuth = () => navigate("/auth");

  const getNavigationOptions = () => {
    const path = location.pathname.toLowerCase();
    if (path.includes("item") || path.includes("share")) {
      return (
        <div className="flex flex-col gap-2 mt-4">
          {fromPath === "share" && (
            <Button
              onClick={handleRetryShareLink}
              className="flex items-center gap-2"
              variant="outline"
            >
              <RefreshCw className="h-4 w-4" />
              <span>{t("not_found.try_again")}</span>
            </Button>
          )}
          <Button
            onClick={() => navigate("/feed")}
            className="bg-green-500 hover:bg-green-600"
          >
            {t("not_found.browse_feed")}
          </Button>
          <Button
            onClick={() => navigate("/map")}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            <span>{t("not_found.browse_map")}</span>
          </Button>
        </div>
      );
    }
    return (
      <Button
        onClick={() => navigate("/")}
        className="bg-green-500 hover:bg-green-600 mt-4"
      >
        {t("not_found.return_to_home")}
      </Button>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        {authError ? (
          <>
            <Alert variant="destructive" className="text-left">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{t("not_found.auth_error")}</AlertTitle>
              <AlertDescription>{getErrorMessage()}</AlertDescription>
            </Alert>
            <Button
              onClick={handleReturnToAuth}
              className="bg-green-500 hover:bg-green-600"
            >
              {t("not_found.return_to_sign_in")}
            </Button>
          </>
        ) : (
          <>
            <h1 className="text-4xl font-bold mb-2">{t("not_found.title")}</h1>
            <p className="text-xl text-muted-foreground mb-2">
              {t("not_found.page_not_found")}
            </p>

            {/* The actual URL we tried to load. Showing this up front
                makes mismatched CTAs (e.g. /post/5 → /item/5) obvious
                without needing a console. */}
            <div className="text-left bg-card border border-border rounded-md p-3 text-sm space-y-1">
              <div>
                <span className="font-medium">{t("not_found.requested_url")}:</span>{" "}
                <code className="break-all text-muted-foreground">
                  {location.pathname}
                  {location.search}
                  {location.hash}
                </code>
              </div>
              {referrer && (
                <div>
                  <span className="font-medium">{t("not_found.came_from")}:</span>{" "}
                  <code className="break-all text-muted-foreground">
                    {referrer}
                  </code>
                </div>
              )}
            </div>

            {fromPath === "share" && (
              <Alert variant="destructive" className="text-left">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>
                  {t("not_found.item_not_found_title")}
                </AlertTitle>
                <AlertDescription>
                  {errorMsg === "Invalid item ID format - not a number"
                    ? t("not_found.invalid_item_link")
                    : errorMsg?.includes("Database error")
                      ? t("not_found.database_trouble")
                      : t("not_found.shared_item_not_found", { itemId })}
                </AlertDescription>
              </Alert>
            )}

            <p className="text-sm text-muted-foreground">
              {fromPath === "unknown"
                ? t("not_found.page_doesnt_exist")
                : getErrorMessage()}
            </p>

            {getNavigationOptions()}

            {/* Collapsible diagnostic block — handy for support reports
                without cluttering the page for normal users. */}
            <details className="text-left mt-4 text-xs text-muted-foreground">
              <summary className="cursor-pointer select-none">
                {t("not_found.diagnostic_details")}
              </summary>
              <pre className="mt-2 p-2 bg-muted rounded overflow-auto max-h-48">
                {JSON.stringify(diagnostics, null, 2)}
              </pre>
              <Button
                onClick={handleCopyDetails}
                variant="outline"
                size="sm"
                className="mt-2 flex items-center gap-2"
              >
                {copied ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
                <span>
                  {copied
                    ? t("not_found.details_copied")
                    : t("not_found.copy_details")}
                </span>
              </Button>
            </details>
          </>
        )}
      </div>
    </div>
  );
};

export default NotFound;
