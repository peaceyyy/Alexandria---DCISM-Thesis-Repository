-- Read-only preflight for making staff-published records appear in the
-- publishing staff member's My Submissions list.
--
-- Run this in the Supabase SQL Editor and paste the single JSON result here.
-- It confirms the deployed staff-publish function and whether historic rows
-- can be attributed unambiguously from their staff-direct-publish audit event.

WITH staff_publish_audits AS (
  SELECT
    audit.thesis_id,
    array_agg(DISTINCT audit.changed_by_user_id) AS publisher_ids,
    count(DISTINCT audit.changed_by_user_id) AS publisher_count
  FROM public.thesis_audits AS audit
  WHERE audit.event = 'submitted'
    AND audit.change_details ->> 'submission_mode' = 'staff_direct_publish'
  GROUP BY audit.thesis_id
),
staff_published_theses AS (
  SELECT
    thesis.id,
    thesis.title,
    thesis.submitted_by_user_id,
    thesis.review_status,
    audit.publisher_ids,
    audit.publisher_count
  FROM public.theses AS thesis
  INNER JOIN staff_publish_audits AS audit ON audit.thesis_id = thesis.id
)
SELECT jsonb_pretty(
  jsonb_build_object(
    'staff_publish_function', (
      SELECT pg_get_functiondef(proc.oid)
      FROM pg_proc AS proc
      JOIN pg_namespace AS ns ON ns.oid = proc.pronamespace
      WHERE ns.nspname = 'public'
        AND proc.proname = 'publish_staff_thesis_transaction'
        AND pg_get_function_identity_arguments(proc.oid) = 'payload jsonb'
    ),
    'historic_staff_published_rows', (
      SELECT COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'id', id,
            'title', title,
            'submitted_by_user_id', submitted_by_user_id,
            'review_status', review_status,
            'publisher_ids', publisher_ids,
            'publisher_count', publisher_count
          )
          ORDER BY id
        ),
        '[]'::jsonb
      )
      FROM staff_published_theses
    ),
    'unambiguous_unattributed_count', (
      SELECT count(*)
      FROM staff_published_theses
      WHERE submitted_by_user_id IS NULL
        AND publisher_count = 1
    ),
    'ambiguous_or_missing_audit_count', (
      SELECT count(*)
      FROM staff_published_theses
      WHERE submitted_by_user_id IS NULL
        AND publisher_count <> 1
    )
  )
);
