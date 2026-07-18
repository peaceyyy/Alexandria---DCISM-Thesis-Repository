-- Alexandria admin activity context postflight (READ ONLY)
--
-- Run this only after the reviewed migration has been applied to the same
-- Supabase project checked by admin_activity_context_preflight.sql.
-- It makes no data or policy changes. The two auth-context blocks are wrapped
-- in transactions and rolled back after their read-only RPC calls.
--
-- The auth-context blocks automatically select one active reviewer and one
-- active member. They do not modify either account or any application data.

-- 1. Confirm the deployed RPC signatures, security mode, fixed search path,
-- and authenticated execute grants.
WITH required_rpc(label, signature) AS (
  VALUES
    (
      'dashboard snapshot',
      'public.get_admin_dashboard_snapshot()'
    ),
    (
      'paginated activity',
      'public.get_admin_activity_page(integer,integer)'
    )
), resolved_rpc AS (
  SELECT
    label,
    signature,
    to_regprocedure(signature) AS function_oid
  FROM required_rpc
)
SELECT
  resolved_rpc.label,
  resolved_rpc.signature,
  resolved_rpc.function_oid IS NOT NULL AS function_exists,
  COALESCE(procedure.prosecdef, false) AS security_definer,
  procedure.proconfig AS function_settings,
  CASE
    WHEN resolved_rpc.function_oid IS NULL THEN false
    ELSE has_function_privilege(
      'authenticated',
      resolved_rpc.function_oid,
      'EXECUTE'
    )
  END AS authenticated_can_execute
FROM resolved_rpc
LEFT JOIN pg_proc AS procedure ON procedure.oid = resolved_rpc.function_oid
ORDER BY resolved_rpc.label;

-- 2. Confirm no anonymous execution grant was introduced.
WITH required_rpc(signature) AS (
  VALUES
    ('public.get_admin_dashboard_snapshot()'),
    ('public.get_admin_activity_page(integer,integer)')
)
SELECT
  signature,
  has_function_privilege('anon', to_regprocedure(signature), 'EXECUTE')
    AS anon_can_execute
FROM required_rpc;

-- 3. Run under a simulated active reviewer context. Expected: every `*_valid`
-- column is true. An empty activity history is valid.
BEGIN;
DO $$
DECLARE
  reviewer_id uuid;
BEGIN
  SELECT id
  INTO reviewer_id
  FROM public.users
  WHERE role IN ('admin', 'moderator')
    AND deactivated_at IS NULL
  ORDER BY id
  LIMIT 1;

  IF reviewer_id IS NULL THEN
    RAISE EXCEPTION
      'Postflight needs at least one active admin or moderator account.'
      USING ERRCODE = 'P0002';
  END IF;

  PERFORM set_config('request.jwt.claim.sub', reviewer_id::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
END;
$$;

WITH snapshot AS (
  SELECT public.get_admin_dashboard_snapshot() AS payload
), activity AS (
  SELECT activity_item.value AS item,
    activity_item.ordinality AS position
  FROM snapshot
  LEFT JOIN LATERAL jsonb_array_elements(
    snapshot.payload -> 'recent_activity'
  ) WITH ORDINALITY AS activity_item(value, ordinality) ON true
), ordered_activity AS (
  SELECT
    item,
    position,
    lag((item ->> 'occurred_at')::timestamptz) OVER (
      ORDER BY position
    ) AS prior_occurred_at,
    lag((item ->> 'id')::bigint) OVER (
      ORDER BY position
    ) AS prior_id
  FROM activity
  WHERE item IS NOT NULL
)
SELECT
  jsonb_typeof(snapshot.payload -> 'recent_activity') = 'array'
    AS preview_is_array,
  jsonb_array_length(snapshot.payload -> 'recent_activity') <= 5
    AS preview_is_limited_to_five,
  COALESCE(
    bool_and(
      item ? 'id'
      AND item ? 'thesis_id'
      AND item ? 'thesis_title'
      AND item ? 'actor_name'
      AND item ? 'event'
      AND item ? 'description'
      AND item ? 'occurred_at'
    ) FILTER (WHERE item IS NOT NULL),
    true
  ) AS preview_has_context_fields,
  COALESCE(
    bool_and(
      NULLIF(btrim(item ->> 'thesis_title'), '') IS NOT NULL
      AND NULLIF(btrim(item ->> 'actor_name'), '') IS NOT NULL
      AND NULLIF(btrim(item ->> 'description'), '') IS NOT NULL
    ) FILTER (WHERE item IS NOT NULL),
    true
  ) AS preview_uses_nonblank_context,
  COALESCE(
    (
      SELECT bool_and(
        prior_occurred_at IS NULL
        OR (prior_occurred_at, prior_id) >= (
          (item ->> 'occurred_at')::timestamptz,
          (item ->> 'id')::bigint
        )
      )
      FROM ordered_activity
    ),
    true
  ) AS preview_is_newest_first
FROM snapshot
LEFT JOIN activity ON true
GROUP BY snapshot.payload;

WITH page_one AS (
  SELECT public.get_admin_activity_page(1, 2) AS payload
)
SELECT
  jsonb_typeof(payload -> 'items') = 'array' AS items_is_array,
  (payload ->> 'page')::integer = 1 AS page_is_one,
  (payload ->> 'limit')::integer = 2 AS requested_limit_preserved,
  (payload ->> 'total_count')::integer >= jsonb_array_length(payload -> 'items')
    AS total_covers_page,
  jsonb_array_length(payload -> 'items') <= 2 AS page_is_limited,
  COALESCE(
    bool_and(
      item ? 'id'
      AND item ? 'thesis_id'
      AND item ? 'thesis_title'
      AND item ? 'actor_name'
      AND item ? 'event'
      AND item ? 'description'
      AND item ? 'occurred_at'
    ),
    true
  ) AS page_items_have_context_fields
FROM page_one
LEFT JOIN LATERAL jsonb_array_elements(
  page_one.payload -> 'items'
) AS page_item(item) ON true
GROUP BY page_one.payload;

-- The first two small pages must not repeat an audit id.
WITH first_page AS (
  SELECT value ->> 'id' AS id
  FROM jsonb_array_elements(
    public.get_admin_activity_page(1, 2) -> 'items'
  )
), second_page AS (
  SELECT value ->> 'id' AS id
  FROM jsonb_array_elements(
    public.get_admin_activity_page(2, 2) -> 'items'
  )
)
SELECT NOT EXISTS (
  SELECT 1
  FROM first_page
  INNER JOIN second_page USING (id)
) AS first_two_pages_are_disjoint;

-- Invalid pagination input must fail with the validation SQLSTATE 22023.
DO $$
BEGIN
  BEGIN
    PERFORM public.get_admin_activity_page(0, 20);
    RAISE EXCEPTION 'Expected page=0 to be rejected with SQLSTATE 22023.';
  EXCEPTION
    WHEN SQLSTATE '22023' THEN
      RAISE NOTICE 'Invalid page input was rejected as expected.';
  END;
END;
$$;

ROLLBACK;

-- 4. Run under a simulated active non-reviewer context. Expected: both
-- protected RPCs reject the caller with SQLSTATE 42501.
BEGIN;
DO $$
DECLARE
  member_id uuid;
BEGIN
  SELECT id
  INTO member_id
  FROM public.users
  WHERE role = 'member'
    AND deactivated_at IS NULL
  ORDER BY id
  LIMIT 1;

  IF member_id IS NULL THEN
    RAISE EXCEPTION
      'Postflight needs at least one active member account.'
      USING ERRCODE = 'P0002';
  END IF;

  PERFORM set_config('request.jwt.claim.sub', member_id::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
END;
$$;

DO $$
BEGIN
  BEGIN
    PERFORM public.get_admin_dashboard_snapshot();
    RAISE EXCEPTION 'Expected snapshot access to be rejected with SQLSTATE 42501.';
  EXCEPTION
    WHEN SQLSTATE '42501' THEN
      RAISE NOTICE 'Non-reviewer snapshot access was rejected as expected.';
  END;

  BEGIN
    PERFORM public.get_admin_activity_page(1, 20);
    RAISE EXCEPTION 'Expected activity-page access to be rejected with SQLSTATE 42501.';
  EXCEPTION
    WHEN SQLSTATE '42501' THEN
      RAISE NOTICE 'Non-reviewer activity access was rejected as expected.';
  END;
END;
$$;

ROLLBACK;
