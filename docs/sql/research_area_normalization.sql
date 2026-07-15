-- Alexandria research-area normalization and staff-search v2.
-- Preflight reviewed on 2026-07-16 against public.theses.research_area.
-- This migration is additive for functions and preserves search_review_submission_ids v1.

BEGIN;

UPDATE public.theses
SET research_area = CASE research_area
  WHEN 'Artificial Intelligence' THEN 'ai_engineering'
  WHEN 'Web Development, Algorithms' THEN 'web_development,algorithms'
  WHEN 'IoT' THEN 'iot'
  WHEN 'Networking' THEN 'networking'
  WHEN 'Web Development, Algorithms, hello, i just chaged it'
    THEN 'web_development,algorithms'
  ELSE research_area
END
WHERE research_area IN (
  'Artificial Intelligence',
  'Web Development, Algorithms',
  'IoT',
  'Networking',
  'Web Development, Algorithms, hello, i just chaged it'
);

CREATE OR REPLACE FUNCTION public.research_area_ids_are_valid(value text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
STRICT
SET search_path = pg_catalog, public
AS $$
  WITH values_to_check AS (
    SELECT string_to_array(value, ',') AS ids
  )
  SELECT value = btrim(value)
    AND value <> ''
    AND NOT EXISTS (
      SELECT 1
      FROM unnest(values_to_check.ids) AS area(research_area_id)
      WHERE area.research_area_id = ''
        OR area.research_area_id <> ALL (ARRAY[
          'ai_engineering',
          'machine_learning',
          'web_development',
          'mobile_development',
          'cybersecurity',
          'iot',
          'data_science',
          'networking',
          'algorithms',
          'mathematics'
        ]::text[])
    )
    AND cardinality(values_to_check.ids) = (
      SELECT count(DISTINCT area.research_area_id)
      FROM unnest(values_to_check.ids) AS area(research_area_id)
    )
  FROM values_to_check;
$$;

ALTER TABLE public.theses
  DROP CONSTRAINT IF EXISTS theses_research_area_ids_check;

ALTER TABLE public.theses
  ADD CONSTRAINT theses_research_area_ids_check
  CHECK (
    research_area IS NULL
    OR public.research_area_ids_are_valid(research_area)
  );

CREATE OR REPLACE FUNCTION public.admin_update_submission_metadata(
  target_thesis_id bigint,
  payload jsonb,
  correction_reason text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  current_thesis public.theses%ROWTYPE;
  current_calendar_date date;
  next_publication_date date;
  next_study_type text;
  author jsonb;
  tag text;
  before_details jsonb;
  after_details jsonb;
BEGIN
  IF NOT public.current_user_is_active(ARRAY['admin']) THEN
    RAISE EXCEPTION 'An active administrator account is required'
      USING ERRCODE = '42501';
  END IF;

  IF jsonb_typeof(payload) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'Submission changes must be an object'
      USING ERRCODE = '22023';
  END IF;

  IF NULLIF(btrim(correction_reason), '') IS NULL THEN
    RAISE EXCEPTION 'A correction reason is required'
      USING ERRCODE = '22023';
  END IF;

  SELECT *
  INTO current_thesis
  FROM public.theses
  WHERE id = target_thesis_id
  FOR UPDATE;

  IF current_thesis.id IS NULL THEN
    RAISE EXCEPTION 'Thesis was not found'
      USING ERRCODE = 'P0002';
  END IF;

  IF current_thesis.review_status = 'trashed' THEN
    RAISE EXCEPTION 'Restore the thesis before correcting its metadata'
      USING ERRCODE = '42501';
  END IF;

  current_calendar_date := (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Manila')::date;

  IF payload ? 'publication_date' THEN
    next_publication_date := NULLIF(payload->>'publication_date', '')::date;

    IF next_publication_date IS NULL THEN
      RAISE EXCEPTION 'Publication date is required'
        USING ERRCODE = '22023';
    END IF;

    IF next_publication_date > current_calendar_date THEN
      RAISE EXCEPTION 'Publication date cannot be later than today'
        USING ERRCODE = '22023';
    END IF;
  END IF;

  IF payload ? 'study_type' THEN
    next_study_type := payload->>'study_type';
    IF next_study_type NOT IN ('thesis', 'capstone') THEN
      RAISE EXCEPTION 'Study type must be thesis or capstone'
        USING ERRCODE = '22023';
    END IF;
  END IF;

  IF payload ? 'department' AND payload->>'department' NOT IN ('CS', 'IT', 'IS') THEN
    RAISE EXCEPTION 'Department must be CS, IT, or IS'
      USING ERRCODE = '22023';
  END IF;

  IF payload ? 'research_area'
    AND NOT public.research_area_ids_are_valid(payload->>'research_area')
  THEN
    RAISE EXCEPTION 'Research area must use one or more supported research-area IDs'
      USING ERRCODE = '22023';
  END IF;

  before_details := jsonb_build_object(
    'thesis', to_jsonb(current_thesis),
    'authors', COALESCE((
      SELECT jsonb_agg(to_jsonb(thesis_author) ORDER BY thesis_author.sort_order, thesis_author.id)
      FROM public.thesis_authors AS thesis_author
      WHERE thesis_author.thesis_id = target_thesis_id
    ), '[]'::jsonb),
    'tags', COALESCE((
      SELECT jsonb_agg(thesis_tag.tag ORDER BY thesis_tag.id)
      FROM public.thesis_tags AS thesis_tag
      WHERE thesis_tag.thesis_id = target_thesis_id
    ), '[]'::jsonb)
  );

  UPDATE public.theses
  SET
    title = CASE WHEN payload ? 'title' THEN payload->>'title' ELSE title END,
    abstract = CASE WHEN payload ? 'abstract' THEN payload->>'abstract' ELSE abstract END,
    department = CASE WHEN payload ? 'department' THEN payload->>'department' ELSE department END,
    research_area = CASE WHEN payload ? 'research_area' THEN payload->>'research_area' ELSE research_area END,
    publication_date = CASE WHEN payload ? 'publication_date' THEN next_publication_date ELSE publication_date END,
    year = CASE
      WHEN payload ? 'publication_date' THEN EXTRACT(YEAR FROM next_publication_date)::integer
      ELSE year
    END,
    publication_link = CASE WHEN payload ? 'publication_link' THEN NULLIF(payload->>'publication_link', '') ELSE publication_link END,
    conference = CASE WHEN payload ? 'conference' THEN NULLIF(payload->>'conference', '') ELSE conference END,
    recommendations = CASE WHEN payload ? 'recommendations' THEN NULLIF(payload->>'recommendations', '') ELSE recommendations END,
    lessons_learned = CASE WHEN payload ? 'lessons_learned' THEN NULLIF(payload->>'lessons_learned', '') ELSE lessons_learned END,
    study_type = CASE WHEN payload ? 'study_type' THEN next_study_type ELSE study_type END,
    updated_at = now()
  WHERE id = target_thesis_id;

  IF payload ? 'authors' THEN
    IF jsonb_typeof(payload->'authors') IS DISTINCT FROM 'array'
      OR jsonb_array_length(payload->'authors') = 0
    THEN
      RAISE EXCEPTION 'At least one thesis author is required'
        USING ERRCODE = '22023';
    END IF;

    DELETE FROM public.thesis_authors
    WHERE thesis_id = target_thesis_id;

    FOR author IN SELECT * FROM jsonb_array_elements(payload->'authors')
    LOOP
      IF NULLIF(btrim(author->>'display_name'), '') IS NULL THEN
        RAISE EXCEPTION 'Every thesis author requires a display name'
          USING ERRCODE = '22023';
      END IF;

      IF author->>'contribution_role' NOT IN ('author', 'adviser') THEN
        RAISE EXCEPTION 'Contribution role must be author or adviser'
          USING ERRCODE = '22023';
      END IF;

      INSERT INTO public.thesis_authors (
        thesis_id, user_id, display_name, contribution_role, sort_order
      ) VALUES (
        target_thesis_id,
        NULLIF(author->>'user_id', '')::uuid,
        btrim(author->>'display_name'),
        author->>'contribution_role',
        NULLIF(author->>'sort_order', '')::integer
      );
    END LOOP;
  END IF;

  IF payload ? 'tags' THEN
    IF jsonb_typeof(payload->'tags') IS DISTINCT FROM 'array'
      OR jsonb_array_length(payload->'tags') = 0
    THEN
      RAISE EXCEPTION 'At least one tag is required'
        USING ERRCODE = '22023';
    END IF;

    DELETE FROM public.thesis_tags
    WHERE thesis_id = target_thesis_id;

    FOR tag IN SELECT * FROM jsonb_array_elements_text(payload->'tags')
    LOOP
      IF NULLIF(btrim(tag), '') IS NOT NULL THEN
        INSERT INTO public.thesis_tags (thesis_id, tag)
        VALUES (target_thesis_id, btrim(tag));
      END IF;
    END LOOP;
  END IF;

  after_details := jsonb_build_object(
    'thesis', (SELECT to_jsonb(thesis) FROM public.theses AS thesis WHERE thesis.id = target_thesis_id),
    'authors', COALESCE((
      SELECT jsonb_agg(to_jsonb(thesis_author) ORDER BY thesis_author.sort_order, thesis_author.id)
      FROM public.thesis_authors AS thesis_author
      WHERE thesis_author.thesis_id = target_thesis_id
    ), '[]'::jsonb),
    'tags', COALESCE((
      SELECT jsonb_agg(thesis_tag.tag ORDER BY thesis_tag.id)
      FROM public.thesis_tags AS thesis_tag
      WHERE thesis_tag.thesis_id = target_thesis_id
    ), '[]'::jsonb)
  );

  INSERT INTO public.thesis_audits (
    thesis_id, changed_by_user_id, event, change_description, change_details
  ) VALUES (
    target_thesis_id,
    auth.uid(),
    'metadata_edited',
    'Administrator corrected thesis metadata. Reason: ' || btrim(correction_reason),
    jsonb_build_object('reason', btrim(correction_reason), 'before', before_details, 'after', after_details)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.search_review_submission_ids_v2(
  p_query text DEFAULT NULL,
  p_scope text DEFAULT 'title',
  p_review_status text DEFAULT NULL,
  p_department text DEFAULT NULL,
  p_research_area text DEFAULT NULL,
  p_page integer DEFAULT 1,
  p_limit integer DEFAULT 20
)
RETURNS TABLE(thesis_id bigint, total_count bigint)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  normalized_query text := NULLIF(btrim(p_query), '');
  safe_page integer := GREATEST(COALESCE(p_page, 1), 1);
  safe_limit integer := LEAST(GREATEST(COALESCE(p_limit, 20), 1), 100);
BEGIN
  IF auth.uid() IS NULL
    OR NOT public.current_user_is_active(ARRAY['admin', 'moderator'])
  THEN
    RAISE EXCEPTION 'An active administrator or moderator account is required'
      USING ERRCODE = '42501';
  END IF;

  IF p_scope NOT IN ('title', 'author') THEN
    RAISE EXCEPTION 'Search scope must be title or author'
      USING ERRCODE = '22023';
  END IF;

  IF p_review_status IS NOT NULL
    AND p_review_status NOT IN ('for_review', 'flagged', 'accepted', 'trashed')
  THEN
    RAISE EXCEPTION 'A valid review status is required'
      USING ERRCODE = '22023';
  END IF;

  IF p_department IS NOT NULL AND p_department NOT IN ('CS', 'IT', 'IS') THEN
    RAISE EXCEPTION 'Department must be CS, IT, or IS'
      USING ERRCODE = '22023';
  END IF;

  IF p_research_area IS NOT NULL
    AND (
      NOT public.research_area_ids_are_valid(p_research_area)
      OR position(',' IN p_research_area) > 0
    )
  THEN
    RAISE EXCEPTION 'A single valid research-area ID is required'
      USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  WITH matches AS (
    SELECT thesis.id, thesis.created_at
    FROM public.theses AS thesis
    WHERE (
      (p_review_status IS NULL AND thesis.review_status <> 'trashed')
      OR thesis.review_status = p_review_status
    )
      AND (p_department IS NULL OR thesis.department = p_department)
      AND (
        p_research_area IS NULL
        OR p_research_area = ANY(regexp_split_to_array(thesis.research_area, '\s*,\s*'))
      )
      AND (
        normalized_query IS NULL
        OR (p_scope = 'title' AND thesis.title ILIKE '%' || normalized_query || '%')
        OR (p_scope = 'author' AND EXISTS (
          SELECT 1
          FROM public.thesis_authors AS author
          WHERE author.thesis_id = thesis.id
            AND author.display_name ILIKE '%' || normalized_query || '%'
        ))
      )
  )
  SELECT matches.id, count(*) OVER ()::bigint
  FROM matches
  ORDER BY matches.created_at DESC, matches.id DESC
  LIMIT safe_limit
  OFFSET (safe_page - 1) * safe_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_submission_metadata(bigint, jsonb, text)
  FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_update_submission_metadata(bigint, jsonb, text)
  FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_update_submission_metadata(bigint, jsonb, text)
  TO authenticated;

REVOKE ALL ON FUNCTION public.search_review_submission_ids_v2(text, text, text, text, text, integer, integer)
  FROM PUBLIC;
REVOKE ALL ON FUNCTION public.search_review_submission_ids_v2(text, text, text, text, text, integer, integer)
  FROM anon;
GRANT EXECUTE ON FUNCTION public.search_review_submission_ids_v2(text, text, text, text, text, integer, integer)
  TO authenticated;

COMMIT;
