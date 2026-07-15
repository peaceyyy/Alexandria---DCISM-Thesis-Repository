-- Alexandria staff review search extension.
-- Preflight confirmed on 2026-07-16:
--   public.theses(id, title, department, review_status, created_at)
--   public.thesis_authors(thesis_id, display_name)
--   public.thesis_tags(thesis_id, tag)
-- Apply after human review. This is additive and does not alter existing rows.

BEGIN;

CREATE OR REPLACE FUNCTION public.search_review_submission_ids(
  p_query text,
  p_scope text,
  p_review_status text DEFAULT NULL,
  p_department text DEFAULT NULL,
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
  normalized_query text := btrim(p_query);
  safe_page integer := GREATEST(COALESCE(p_page, 1), 1);
  safe_limit integer := LEAST(GREATEST(COALESCE(p_limit, 20), 1), 100);
BEGIN
  IF auth.uid() IS NULL
    OR NOT public.current_user_is_active(ARRAY['admin', 'moderator'])
  THEN
    RAISE EXCEPTION 'An active administrator or moderator account is required'
      USING ERRCODE = '42501';
  END IF;

  IF normalized_query = '' THEN
    RAISE EXCEPTION 'A search query is required'
      USING ERRCODE = '22023';
  END IF;

  IF p_scope NOT IN ('author', 'tag') THEN
    RAISE EXCEPTION 'Search scope must be author or tag'
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
        (p_scope = 'author' AND EXISTS (
          SELECT 1
          FROM public.thesis_authors AS author
          WHERE author.thesis_id = thesis.id
            AND author.display_name ILIKE '%' || normalized_query || '%'
        ))
        OR (p_scope = 'tag' AND EXISTS (
          SELECT 1
          FROM public.thesis_tags AS tag
          WHERE tag.thesis_id = thesis.id
            AND tag.tag ILIKE '%' || normalized_query || '%'
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

REVOKE ALL ON FUNCTION public.search_review_submission_ids(text, text, text, text, integer, integer)
  FROM PUBLIC;
REVOKE ALL ON FUNCTION public.search_review_submission_ids(text, text, text, text, integer, integer)
  FROM anon;
GRANT EXECUTE ON FUNCTION public.search_review_submission_ids(text, text, text, text, integer, integer)
  TO authenticated;

COMMIT;
