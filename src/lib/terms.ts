// Terms of use (src/pages/Terms.tsx, /villkor). Bump TERMS_VERSION when the
// terms change materially: everyone who accepted an older version then sees
// the one-time "Vi har nya villkor" screen again (TermsGate). The database
// function accept_terms() accepts any 1–4 digit version string.
export const TERMS_VERSION = "1";

/** Shown at the top of the terms page. The day version 1 went live on pif.today. */
export const TERMS_EFFECTIVE_DATE = { sv: "24 november 2026", en: "24 November 2026" };

/** Pages where the one-time terms screen never pops up. */
export const TERMS_SCREEN_EXEMPT_PATHS = ["/villkor", "/terms", "/privacy", "/auth", "/create-profile", "/reset-password", "/email-confirmation"];
