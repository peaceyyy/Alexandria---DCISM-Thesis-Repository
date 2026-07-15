-- Standalone reference for the secured submission RPC.
-- The deployable definition is also included in admin_dashboard_backend.sql so
-- the inspected MVP migration can be applied atomically.

DROP FUNCTION IF EXISTS public.submit_thesis_transaction(jsonb);

CREATE FUNCTION public.submit_thesis_transaction(payload jsonb)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  new_thesis_id bigint;
  authenticated_user_id uuid;
  current_calendar_date date;
  thesis_year integer;
  thesis_publication_date date;
  thesis_study_type text;
  uploaded_storage_path text;
  author jsonb;
  tag text;
BEGIN
  authenticated_user_id := auth.uid();
  current_calendar_date :=
    (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Manila')::date;

  IF authenticated_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required to submit a thesis'
      USING ERRCODE = '42501';
  END IF;

  IF NOT public.current_user_is_active() THEN
    RAISE EXCEPTION 'An active authenticated user profile is required'
      USING ERRCODE = '42501';
  END IF;

  thesis_year := (payload->>'year')::integer;
  thesis_publication_date := NULLIF(payload->>'publication_date', '')::date;
  thesis_study_type := COALESCE(payload->>'study_type', 'thesis');
  uploaded_storage_path := NULLIF(payload->>'storage_path', '');

  IF thesis_year IS NULL
    OR thesis_year < 1
    OR thesis_year > EXTRACT(YEAR FROM current_calendar_date)::integer
  THEN
    RAISE EXCEPTION 'Thesis year must be between 1 and the current year'
      USING ERRCODE = '22023';
  END IF;

  IF thesis_publication_date IS NULL
    OR thesis_publication_date > current_calendar_date
  THEN
    RAISE EXCEPTION 'Publication date must be present and not later than today'
      USING ERRCODE = '22023';
  END IF;

  IF EXTRACT(YEAR FROM thesis_publication_date)::integer <> thesis_year THEN
    RAISE EXCEPTION 'Thesis year must match the publication date year'
      USING ERRCODE = '22023';
  END IF;

  IF thesis_study_type NOT IN ('thesis', 'capstone') THEN
    RAISE EXCEPTION 'Study type must be thesis or capstone'
      USING ERRCODE = '22023';
  END IF;

  IF payload->>'department' NOT IN ('CS', 'IT', 'IS') THEN
    RAISE EXCEPTION 'Department must be CS, IT, or IS'
      USING ERRCODE = '22023';
  END IF;

  IF payload->>'file_type' IS DISTINCT FROM 'application/pdf' THEN
    RAISE EXCEPTION 'Thesis file type must be application/pdf'
      USING ERRCODE = '22023';
  END IF;

  IF uploaded_storage_path IS NULL
    OR uploaded_storage_path NOT LIKE
      ('uploads/' || authenticated_user_id::text || '/%')
  THEN
    RAISE EXCEPTION
      'The uploaded file path must belong to the authenticated user'
      USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM storage.objects
    WHERE bucket_id = 'thesis_files_bucket'
      AND name = uploaded_storage_path
  ) THEN
    RAISE EXCEPTION 'The uploaded thesis PDF was not found in Storage'
      USING ERRCODE = '22023';
  END IF;

  IF jsonb_typeof(payload->'authors') IS DISTINCT FROM 'array'
    OR jsonb_array_length(payload->'authors') = 0
  THEN
    RAISE EXCEPTION 'At least one thesis author is required'
      USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.theses (
    title,
    abstract,
    year,
    department,
    research_area,
    publication_date,
    publication_link,
    conference,
    recommendations,
    lessons_learned,
    submitted_by_user_id,
    review_status,
    study_type
  )
  VALUES (
    payload->>'title',
    payload->>'abstract',
    thesis_year,
    payload->>'department',
    payload->>'research_area',
    thesis_publication_date,
    NULLIF(payload->>'publication_link', ''),
    NULLIF(payload->>'conference', ''),
    NULLIF(payload->>'recommendations', ''),
    NULLIF(payload->>'lessons_learned', ''),
    authenticated_user_id,
    'for_review',
    thesis_study_type
  )
  RETURNING id INTO new_thesis_id;

  FOR author IN
    SELECT *
    FROM jsonb_array_elements(payload->'authors')
  LOOP
    IF NULLIF(btrim(author->>'display_name'), '') IS NULL THEN
      RAISE EXCEPTION 'Every thesis author requires a display name'
        USING ERRCODE = '22023';
    END IF;

    INSERT INTO public.thesis_authors (
      thesis_id,
      user_id,
      display_name,
      contribution_role,
      sort_order
    )
    VALUES (
      new_thesis_id,
      NULLIF(author->>'user_id', '')::uuid,
      btrim(author->>'display_name'),
      author->>'contribution_role',
      (author->>'sort_order')::integer
    );
  END LOOP;

  IF jsonb_typeof(payload->'tags') = 'array' THEN
    FOR tag IN
      SELECT *
      FROM jsonb_array_elements_text(payload->'tags')
    LOOP
      IF NULLIF(btrim(tag), '') IS NOT NULL THEN
        INSERT INTO public.thesis_tags (thesis_id, tag)
        VALUES (new_thesis_id, btrim(tag));
      END IF;
    END LOOP;
  END IF;

  INSERT INTO public.thesis_files (
    thesis_id,
    file_url,
    storage_path,
    file_type,
    is_primary
  )
  VALUES (
    new_thesis_id,
    NULL,
    uploaded_storage_path,
    'application/pdf',
    true
  );

  RETURN new_thesis_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_thesis_transaction(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_thesis_transaction(jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.submit_thesis_transaction(jsonb)
  TO authenticated;
