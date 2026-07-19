  -- Alexandria staff submission attribution.
  --
  -- Outcome:
  -- - A staff-published thesis remains directly accepted.
  -- - submitted_by_user_id identifies the admin/moderator who published it.
  -- - Historic staff-published records are backfilled only when one audit actor
  --   can be determined unambiguously.
  --
  -- Live preflight confirmed on 2026-07-20:
  -- - publish_staff_thesis_transaction(jsonb) currently clears the submitter.
  -- - One historic row can be attributed from its staff_direct_publish audit.
  -- - No historic staff-publish rows have ambiguous or missing publisher audits.
  --
  -- This does not alter authors, review status rules, RLS, Storage, or tables.
  
  BEGIN;
  
  -- Refuse to replace an unexpected live function or infer ambiguous history.
  DO $$
  DECLARE
    current_definition text;
    ambiguous_unattributed_count integer;
  BEGIN
    SELECT pg_get_functiondef(
      'public.publish_staff_thesis_transaction(jsonb)'::regprocedure
    )
    INTO current_definition;
  
    IF current_definition IS NULL
      OR position('submitted_by_user_id = NULL' IN current_definition) = 0
    THEN
      RAISE EXCEPTION
        'The reviewed staff-publish ownership behavior was not found; stop and re-run the preflight';
    END IF;
  
    WITH staff_publish_audits AS (
      SELECT
        audit.thesis_id,
        count(DISTINCT audit.changed_by_user_id) AS publisher_count
      FROM public.thesis_audits AS audit
      WHERE audit.event = 'submitted'
        AND audit.change_details ->> 'submission_mode' = 'staff_direct_publish'
      GROUP BY audit.thesis_id
    )
    SELECT count(*)
    INTO ambiguous_unattributed_count
    FROM public.theses AS thesis
    INNER JOIN staff_publish_audits AS audit ON audit.thesis_id = thesis.id
    WHERE thesis.submitted_by_user_id IS NULL
      AND audit.publisher_count <> 1;
  
    IF ambiguous_unattributed_count <> 0 THEN
      RAISE EXCEPTION
        'Found % staff-published rows without one unambiguous audit actor; stop and review them manually',
        ambiguous_unattributed_count;
    END IF;
  END;
  $$;
  
  -- Preserve the publishing staff member as the submitter. The normal submission
  -- transaction still performs all existing payload and Storage-path validation.
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
  
    new_thesis_id := public.submit_thesis_transaction(payload);
  
    UPDATE public.theses
    SET
      submitted_by_user_id = auth.uid(),
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
  
  -- Backfill only records whose existing staff-direct-publish audit identifies
  -- exactly one publisher. Keep updated_at intact: this is attribution repair,
  -- not a fresh thesis edit.
  WITH staff_publish_audits AS (
  SELECT
    audit.thesis_id,
    (
      array_agg(
        DISTINCT audit.changed_by_user_id
        ORDER BY audit.changed_by_user_id
      )
    )[1] AS publisher_id
    FROM public.thesis_audits AS audit
    WHERE audit.event = 'submitted'
      AND audit.change_details ->> 'submission_mode' = 'staff_direct_publish'
    GROUP BY audit.thesis_id
    HAVING count(DISTINCT audit.changed_by_user_id) = 1
  )
  UPDATE public.theses AS thesis
  SET submitted_by_user_id = audit.publisher_id
  FROM staff_publish_audits AS audit
  WHERE thesis.id = audit.thesis_id
    AND thesis.submitted_by_user_id IS NULL;
  
  COMMIT;
