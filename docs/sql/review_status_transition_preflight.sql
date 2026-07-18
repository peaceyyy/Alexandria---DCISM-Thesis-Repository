-- Read-only preflight for the review-status transition update.
-- Run this first in the Supabase SQL editor. It does not modify any data.

WITH status_function_source AS (
  SELECT pg_get_functiondef(
    'public.set_review_status(bigint,text)'::regprocedure
  ) AS definition
),
search_function_source AS (
  SELECT pg_get_functiondef(
    'public.search_review_submission_ids_v2(text,text,text,text,text,integer,integer)'::regprocedure
  ) AS definition
),
comment_policy AS (
  SELECT pg_get_expr(policy.polqual, policy.polrelid) AS using_expression
  FROM pg_policy AS policy
  WHERE policy.polrelid = 'public.thesis_review_comments'::regclass
    AND policy.polname = 'active_users_read_visible_review_comments'
),
status_counts AS (
  SELECT review_status, count(*)::integer AS count
  FROM public.theses
  GROUP BY review_status
)
SELECT jsonb_build_object(
  'status_function_definition', (SELECT definition FROM status_function_source),
  'search_function_definition', (SELECT definition FROM search_function_source),
  'comment_policy_using_expression', (SELECT using_expression FROM comment_policy),
  'status_counts', COALESCE(
    (SELECT jsonb_agg(jsonb_build_object('review_status', review_status, 'count', count)) FROM status_counts),
    '[]'::jsonb
  )
) AS review_status_transition_preflight;
