-- Optional explanatory image per feature announcement, shown under the
-- feature in the announcement email (send-notification-email). One per
-- language because the images contain text. https URLs only; the email
-- ignores anything else. The in-app popup doesn't read these.

ALTER TABLE public.feature_announcements ADD COLUMN IF NOT EXISTS image_url_sv text;
ALTER TABLE public.feature_announcements ADD COLUMN IF NOT EXISTS image_url_en text;
