-- Fix: Realtime DELETE events on `likes` / `interests` were being dropped
-- when subscribed with a server-side filter (e.g. `item_id=eq.X`), because
-- with REPLICA IDENTITY DEFAULT the deleted row's payload only carries the
-- primary key (`id`) — not `item_id` — so the filter never matched and the
-- subscriber never received the DELETE. This caused like/interest counters
-- to "stick" at the pre-unlike count for other clients.
--
-- Setting REPLICA IDENTITY FULL makes Postgres emit the entire OLD row on
-- delete, so the `item_id` column is present and the filter matches.

ALTER TABLE public.likes REPLICA IDENTITY FULL;
ALTER TABLE public.interests REPLICA IDENTITY FULL;
