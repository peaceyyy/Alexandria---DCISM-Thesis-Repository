-- Alexandria admin activity context migration
--
-- Purpose: enrich the dashboard's five-row activity preview and add a guarded,
-- paginated full activity feed for active administrators and moderators.
--
-- Preflight checked on 2026-07-18:
--   - The required tables and columns exist.
--   - 96 audit rows have no missing thesis, actor, title, or description.
--   - Six historic audit rows have a NULL event; this migration exposes them as
--     `status_changed` without rewriting historic data.
--   - The existing dashboard snapshot and active-account helper are guarded
--     SECURITY DEFINER functions with a fixed pg_catalog/public search path.
--   - Existing RLS policies remain unchanged by this migration.
--
-- Apply only after human and database-owner review. Then run
-- admin_activity_context_postflight.sql against the same Supabase project.

BEGIN;

-- Covers the new global order exactly. The existing thesis-scoped audit index
-- remains useful for individual review timelines.
CREATE INDEX IF NOT EXISTS thesis_audits_global_updated_at_id_idx
  ON public.thesis_audits (updated_at DESC, id DESC);

-- Preserve every existing dashboard field and enrich only recent_activity.
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_snapshot()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  snapshot jsonb;
BEGIN
  IF NOT public.current_user_is_active(ARRAY['admin', 'moderator']) THEN
    RAISE EXCEPTION
      'An active administrator or moderator account is required'
      USING ERRCODE = '42501';
  END IF;

  SELECT jsonb_build_object(
    'viewer',
      jsonb_build_object(
        'profile_name',
        (
          SELECT user_profile.profile_name
          FROM public.users AS user_profile
          WHERE user_profile.id = auth.uid()
        )
      ),
    'metrics',
      jsonb_build_object(
        'total_research',
          (
            SELECT count(*)
            FROM public.theses
            WHERE review_status <> 'trashed'
          ),
        'registered_users',
          (
            SELECT count(*)
            FROM public.users
            WHERE deactivated_at IS NULL
          ),
        'pending_docs',
          (
            SELECT count(*)
            FROM public.theses
            WHERE review_status = 'for_review'
          )
      ),
    'recent_uploads',
      COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', recent.id,
              'title', recent.title,
              'author', recent.author,
              'created_at', recent.created_at,
              'review_status', recent.review_status
            )
            ORDER BY recent.created_at DESC, recent.id DESC
          )
          FROM (
            SELECT
              thesis.id,
              thesis.title,
              COALESCE(first_author.display_name, 'Unknown author') AS author,
              thesis.created_at,
              thesis.review_status
            FROM public.theses AS thesis
            LEFT JOIN LATERAL (
              SELECT thesis_author.display_name
              FROM public.thesis_authors AS thesis_author
              WHERE thesis_author.thesis_id = thesis.id
                AND thesis_author.contribution_role = 'author'
              ORDER BY
                thesis_author.sort_order NULLS LAST,
                thesis_author.id
              LIMIT 1
            ) AS first_author ON true
            WHERE thesis.review_status <> 'trashed'
            ORDER BY thesis.created_at DESC, thesis.id DESC
            LIMIT 5
          ) AS recent
        ),
        '[]'::jsonb
      ),
    'recent_activity',
      COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', activity.id,
              'thesis_id', activity.thesis_id,
              'thesis_title', activity.thesis_title,
              'actor_name', activity.actor_name,
              'event', activity.event,
              'description', activity.description,
              'occurred_at', activity.updated_at
            )
            ORDER BY activity.updated_at DESC, activity.id DESC
          )
          FROM (
            SELECT
              audit.id,
              audit.thesis_id,
              COALESCE(
                NULLIF(btrim(thesis.title), ''),
                'Untitled thesis'
              ) AS thesis_title,
              COALESCE(
                NULLIF(btrim(actor.profile_name), ''),
                'Unknown user'
              ) AS actor_name,
              CASE
                WHEN audit.event IN (
                  'submitted',
                  'comment_added',
                  'comment_addressed',
                  'status_changed',
                  'metadata_edited',
                  'pdf_replaced',
                  'resubmitted'
                ) THEN audit.event
                ELSE 'status_changed'
              END AS event,
              COALESCE(
                NULLIF(btrim(audit.change_description), ''),
                'Thesis activity recorded.'
              ) AS description,
              audit.updated_at
            FROM public.thesis_audits AS audit
            LEFT JOIN public.theses AS thesis ON thesis.id = audit.thesis_id
            LEFT JOIN public.users AS actor ON actor.id = audit.changed_by_user_id
            ORDER BY audit.updated_at DESC, audit.id DESC
            LIMIT 5
          ) AS activity
        ),
        '[]'::jsonb
      ),
    'research_by_department',
      COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'department', department_count.department,
              'count', department_count.research_count
            )
            ORDER BY
              department_count.research_count DESC,
              department_count.department
          )
          FROM (
            SELECT department, count(*) AS research_count
            FROM public.theses
            WHERE review_status <> 'trashed'
            GROUP BY department
          ) AS department_count
        ),
        '[]'::jsonb
      )
  )
  INTO snapshot;

  RETURN snapshot;
END;
$$;

-- Full cross-thesis activity feed. The result is database JSON only; the
-- server service maps it to the application DTO and pagination envelope.
CREATE OR REPLACE FUNCTION public.get_admin_activity_page(
  target_page integer,
  target_limit integer
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  effective_limit integer;
  offset_rows bigint;
  total_rows bigint;
  activity_page jsonb;
BEGIN
  IF NOT public.current_user_is_active(ARRAY['admin', 'moderator']) THEN
    RAISE EXCEPTION
      'An active administrator or moderator account is required'
      USING ERRCODE = '42501';
  END IF;

  IF target_page IS NULL OR target_page < 1 THEN
    RAISE EXCEPTION 'Activity page must be a positive integer'
      USING ERRCODE = '22023';
  END IF;

  IF target_limit IS NULL OR target_limit < 1 THEN
    RAISE EXCEPTION 'Activity page limit must be a positive integer'
      USING ERRCODE = '22023';
  END IF;

  effective_limit := LEAST(target_limit, 100);
  offset_rows := (target_page::bigint - 1) * effective_limit::bigint;

  SELECT count(*)
  INTO total_rows
  FROM public.thesis_audits;

  WITH paged_activity AS (
    SELECT
      audit.id,
      audit.thesis_id,
      COALESCE(
        NULLIF(btrim(thesis.title), ''),
        'Untitled thesis'
      ) AS thesis_title,
      COALESCE(
        NULLIF(btrim(actor.profile_name), ''),
        'Unknown user'
      ) AS actor_name,
      CASE
        WHEN audit.event IN (
          'submitted',
          'comment_added',
          'comment_addressed',
          'status_changed',
          'metadata_edited',
          'pdf_replaced',
          'resubmitted'
        ) THEN audit.event
        ELSE 'status_changed'
      END AS event,
      COALESCE(
        NULLIF(btrim(audit.change_description), ''),
        'Thesis activity recorded.'
      ) AS description,
      audit.updated_at
    FROM public.thesis_audits AS audit
    LEFT JOIN public.theses AS thesis ON thesis.id = audit.thesis_id
    LEFT JOIN public.users AS actor ON actor.id = audit.changed_by_user_id
    ORDER BY audit.updated_at DESC, audit.id DESC
    LIMIT effective_limit
    OFFSET offset_rows
  )
  SELECT jsonb_build_object(
    'items',
      COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'id', paged_activity.id,
            'thesis_id', paged_activity.thesis_id,
            'thesis_title', paged_activity.thesis_title,
            'actor_name', paged_activity.actor_name,
            'event', paged_activity.event,
            'description', paged_activity.description,
            'occurred_at', paged_activity.updated_at
          )
          ORDER BY paged_activity.updated_at DESC, paged_activity.id DESC
        ),
        '[]'::jsonb
      ),
    'page', target_page,
    'limit', effective_limit,
    'total_count', total_rows
  )
  INTO activity_page
  FROM paged_activity;

  RETURN activity_page;
END;
$$;

COMMENT ON FUNCTION public.get_admin_activity_page(integer, integer) IS
  'Returns a guarded, paginated, cross-thesis audit activity feed for active reviewers.';

REVOKE ALL ON FUNCTION public.get_admin_dashboard_snapshot() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_admin_dashboard_snapshot() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_snapshot()
  TO authenticated;

REVOKE ALL ON FUNCTION public.get_admin_activity_page(integer, integer)
  FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_admin_activity_page(integer, integer)
  FROM anon;
GRANT EXECUTE ON FUNCTION public.get_admin_activity_page(integer, integer)
  TO authenticated;

COMMIT;
