  -- Run only after review_status_transition_preflight.sql has been reviewed.
  -- Applies admin-only reversible trash behavior. A flagged submission returns to
  -- pending review only through the member-only resubmit_flagged_submission RPC.

  CREATE OR REPLACE FUNCTION public.set_review_status(
    target_thesis_id bigint,
    next_status text
  )
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = pg_catalog, public
  AS $$
  DECLARE
    current_status text;
  BEGIN
    IF NOT public.current_user_is_active(ARRAY['admin', 'moderator']) THEN
      RAISE EXCEPTION 'An active administrator or moderator account is required'
        USING ERRCODE = '42501';
    END IF;

    IF next_status NOT IN ('for_review', 'flagged', 'accepted', 'trashed') THEN
      RAISE EXCEPTION 'That review status transition is not allowed'
        USING ERRCODE = '22023';
    END IF;

    SELECT review_status
    INTO current_status
    FROM public.theses
    WHERE id = target_thesis_id
    FOR UPDATE;

    IF current_status IS NULL THEN
      RAISE EXCEPTION 'Thesis was not found'
        USING ERRCODE = 'P0002';
    END IF;

    IF next_status = 'trashed'
      AND NOT public.current_user_is_active(ARRAY['admin'])
    THEN
      RAISE EXCEPTION 'Only administrators can move a submission to trash'
        USING ERRCODE = '42501';
    END IF;

    IF NOT (
      current_status = 'for_review'
      AND next_status IN ('flagged', 'accepted', 'trashed')
    ) AND NOT (
      current_status = 'accepted'
      AND next_status IN ('for_review', 'trashed')
    ) AND NOT (
      current_status = 'flagged'
      AND next_status = 'trashed'
    ) AND NOT (
      current_status = 'trashed'
      AND next_status = 'for_review'
      AND public.current_user_is_active(ARRAY['admin'])
    ) THEN
      RAISE EXCEPTION 'That review status transition is not allowed'
        USING ERRCODE = '22023';
    END IF;

    IF current_status = next_status THEN
      RETURN;
    END IF;

    UPDATE public.theses
    SET
      review_status = next_status,
      updated_at = now()
    WHERE id = target_thesis_id;

    INSERT INTO public.thesis_audits (
      thesis_id,
      changed_by_user_id,
      event,
      change_description
    )
    VALUES (
      target_thesis_id,
      auth.uid(),
      'status_changed',
      'Review status changed from ' || current_status || ' to ' || next_status || '.'
    );
  END;
  $$;

  REVOKE ALL ON FUNCTION public.set_review_status(bigint, text) FROM PUBLIC;
  REVOKE ALL ON FUNCTION public.set_review_status(bigint, text) FROM anon;
  GRANT EXECUTE ON FUNCTION public.set_review_status(bigint, text) TO authenticated;
