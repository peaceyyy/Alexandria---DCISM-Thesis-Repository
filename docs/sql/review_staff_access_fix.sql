-- Run only after review_status_transition_preflight.sql has been reviewed.
-- Restricts trashed-study discovery and feedback records to administrators.

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

  IF p_review_status = 'trashed'
    AND NOT public.current_user_is_active(ARRAY['admin'])
  THEN
    RAISE EXCEPTION 'Only administrators can view trashed submissions'
      USING ERRCODE = '42501';
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

DROP POLICY IF EXISTS active_users_read_visible_review_comments
  ON public.thesis_review_comments;
CREATE POLICY active_users_read_visible_review_comments
  ON public.thesis_review_comments
  FOR SELECT
  TO authenticated
  USING (
    public.current_user_is_active()
    AND EXISTS (
      SELECT 1
      FROM public.theses AS thesis
      WHERE thesis.id = thesis_review_comments.thesis_id
        AND (
          thesis.submitted_by_user_id = auth.uid()
          OR (
            public.current_user_is_active(ARRAY['admin', 'moderator'])
            AND (
              thesis.review_status <> 'trashed'
              OR public.current_user_is_active(ARRAY['admin'])
            )
          )
        )
    )
  );

REVOKE ALL ON FUNCTION public.search_review_submission_ids_v2(text, text, text, text, text, integer, integer)
  FROM PUBLIC;
REVOKE ALL ON FUNCTION public.search_review_submission_ids_v2(text, text, text, text, text, integer, integer)
  FROM anon;
GRANT EXECUTE ON FUNCTION public.search_review_submission_ids_v2(text, text, text, text, text, integer, integer)
  TO authenticated;
