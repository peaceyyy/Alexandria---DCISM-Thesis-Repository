-- Read-only verification for staff_submission_attribution_backend.sql.
-- Run after the modifying migration commits successfully.

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
      SELECT COALESCE(
        jsonb_build_object(
          'definition', pg_get_functiondef(proc.oid),
          'still_clears_submitter',
            position('submitted_by_user_id = NULL' IN pg_get_functiondef(proc.oid)) > 0
        ),
        '{}'::jsonb
      )
      FROM pg_proc AS proc
      JOIN pg_namespace AS ns ON ns.oid = proc.pronamespace
      WHERE ns.nspname = 'public'
        AND proc.proname = 'publish_staff_thesis_transaction'
        AND pg_get_function_identity_arguments(proc.oid) = 'payload jsonb'
    ),
    'staff_published_rows', (
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
    'remaining_unattributed_staff_published_count', (
      SELECT count(*)
      FROM staff_published_theses
      WHERE submitted_by_user_id IS NULL
    )
  )
);
