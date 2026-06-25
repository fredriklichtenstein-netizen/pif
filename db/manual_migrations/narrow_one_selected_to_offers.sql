-- Narrow the "one selected per item" invariant to pifs (offers) only.
-- Wishes (requests) intentionally support multiple selected fulfillers.
--
-- Strategy: denormalize items.item_type onto interests.item_type
-- (trigger-maintained), then make the existing partial unique index
-- predicate on item_type = 'offer' AS WELL AS status = 'selected'.
-- The denormalized column is required because Postgres partial-index
-- predicates cannot contain subqueries.

BEGIN;

-- 1. Add the denormalized column. Nullable initially so the backfill
--    can run without a default-rewrite of the whole table.
ALTER TABLE public.interests
  ADD COLUMN IF NOT EXISTS item_type text;

-- 2. Backfill from items. Safe to re-run.
UPDATE public.interests i
   SET item_type = it.item_type
  FROM public.items it
 WHERE i.item_id = it.id
   AND (i.item_type IS DISTINCT FROM it.item_type);

-- 3. After backfill, require the column going forward.
ALTER TABLE public.interests
  ALTER COLUMN item_type SET NOT NULL;

-- 4. Trigger: set interests.item_type from items on INSERT and on any
--    UPDATE that changes item_id. We do NOT trust clients to send it.
CREATE OR REPLACE FUNCTION public.interests_set_item_type()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SELECT it.item_type INTO NEW.item_type
    FROM public.items it
   WHERE it.id = NEW.item_id;
  IF NEW.item_type IS NULL THEN
    RAISE EXCEPTION 'interests.item_type: parent item % not found', NEW.item_id
      USING ERRCODE = 'P0002';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_interests_set_item_type_ins ON public.interests;
CREATE TRIGGER trg_interests_set_item_type_ins
  BEFORE INSERT ON public.interests
  FOR EACH ROW EXECUTE FUNCTION public.interests_set_item_type();

DROP TRIGGER IF EXISTS trg_interests_set_item_type_upd ON public.interests;
CREATE TRIGGER trg_interests_set_item_type_upd
  BEFORE UPDATE OF item_id ON public.interests
  FOR EACH ROW
  WHEN (NEW.item_id IS DISTINCT FROM OLD.item_id)
  EXECUTE FUNCTION public.interests_set_item_type();

-- 5. Keep interests.item_type in sync if an item's type ever changes
--    (rare but possible via admin/edit paths). One trigger on items.
CREATE OR REPLACE FUNCTION public.items_propagate_type_to_interests()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.item_type IS DISTINCT FROM OLD.item_type THEN
    UPDATE public.interests
       SET item_type = NEW.item_type
     WHERE item_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_items_propagate_type_to_interests ON public.items;
CREATE TRIGGER trg_items_propagate_type_to_interests
  AFTER UPDATE OF item_type ON public.items
  FOR EACH ROW EXECUTE FUNCTION public.items_propagate_type_to_interests();

-- 6. Swap the partial unique index. Drop the old global one and create
--    the offer-scoped one. Using the same name keeps diagnostics and
--    the existing select_receiver.sql comments coherent.
DROP INDEX IF EXISTS public.interests_one_selected_per_item;

CREATE UNIQUE INDEX interests_one_selected_per_item
  ON public.interests (item_id)
  WHERE status = 'selected' AND item_type = 'offer';

COMMIT;
