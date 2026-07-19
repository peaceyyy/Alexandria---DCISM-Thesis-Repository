-- Alexandria staff direct-publish backend.
--
-- Preconditions confirmed by the 2026-07-20 live preflight:
-- - public.thesis_audits does not yet have change_details.
-- - public.submit_thesis_transaction(jsonb) is the member-only, for_review path.
-- - thesis_files_bucket accepts authenticated uploads only under uploads/{auth.uid()}/...
--
-- Apply this whole script once in the active Supabase SQL Editor.

BEGIN;

-- Repairs the existing metadata-audit RPC, which already writes this column.
ALTER TABLE public.thesis_audits
  ADD COLUMN change_details jsonb;

-- Keeps the ordinary member submission RPC unchanged. Staff upload to their own
-- permitted Storage path, then this wrapper promotes the newly created record
-- straight to accepted and removes member ownership from the staff record.
CREATE OR REPLACE FUNCTION public.publish_staff_thesis_transaction(payload jsonb)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  new_thesis_id bigint;
BEGIN
  IF auth.uid() IS NULL
    OR NOT public.current_user_is_active(ARRAY['admin', 'moderator'])
  THEN
    RAISE EXCEPTION 'An active administrator or moderator account is required'
      USING ERRCODE = '42501';
  END IF;

  -- Reuse the existing transactional payload, PDF-path, author, tag, date, and
  -- publication-year validation. It initially creates a for_review record.
  new_thesis_id := public.submit_thesis_transaction(payload);

  UPDATE public.theses
  SET
    submitted_by_user_id = NULL,
    review_status = 'accepted',
    updated_at = now()
  WHERE id = new_thesis_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'The staff thesis record could not be published'
      USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.thesis_audits (
    thesis_id,
    changed_by_user_id,
    event,
    change_description,
    change_details
  )
  VALUES (
    new_thesis_id,
    auth.uid(),
    'submitted',
    'Staff member published a thesis record directly.',
    jsonb_build_object('submission_mode', 'staff_direct_publish')
  );

  RETURN new_thesis_id;
END;
$$;

-- The existing function has an admin-only role guard. Preserve its live body,
-- including its current validation rules, and change only the agreed staff
-- access rule and audit wording. The precondition prevents a silent rewrite if
-- the live function has drifted since the reviewed preflight.
DO $$
DECLARE
  current_definition text;
BEGIN
  SELECT pg_get_functiondef(
    'public.admin_update_submission_metadata(bigint,jsonb,text)'::regprocedure
  )
  INTO current_definition;

  IF position('current_user_is_active(ARRAY[''admin''])' IN current_definition) = 0 THEN
    RAISE EXCEPTION
      'The reviewed admin metadata role guard was not found; stop and re-run the preflight';
  END IF;

  current_definition := replace(
    current_definition,
    'current_user_is_active(ARRAY[''admin''])',
    'current_user_is_active(ARRAY[''admin'', ''moderator''])'
  );
  current_definition := replace(
    current_definition,
    'An active administrator account is required',
    'An active administrator or moderator account is required'
  );
  current_definition := replace(
    current_definition,
    'Administrator corrected thesis metadata.',
    'Staff member corrected thesis metadata.'
  );

  EXECUTE current_definition;
END;
$$;

REVOKE ALL ON FUNCTION public.publish_staff_thesis_transaction(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.publish_staff_thesis_transaction(jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.publish_staff_thesis_transaction(jsonb)
  TO authenticated;

REVOKE ALL ON FUNCTION public.admin_update_submission_metadata(bigint, jsonb, text)
  FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_update_submission_metadata(bigint, jsonb, text)
  FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_update_submission_metadata(bigint, jsonb, text)
  TO authenticated;

COMMIT;
