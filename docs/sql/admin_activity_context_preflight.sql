-- Alexandria admin activity context preflight (READ ONLY)
--
-- Run this in the intended Supabase project's SQL editor before applying an
-- activity-context migration. It makes no changes.
--
-- Expected outcome before deployment:
--   - The source tables/columns and existing dashboard RPC are present.
--   - get_admin_activity_page(integer, integer) is absent.
--   - Any incomplete historic audit rows are counted so the migration can rely
--     on its documented display fallbacks instead of failing or dropping rows.

-- 1. Confirm the exact database/project target in the SQL editor session.
SELECT
  current_database() AS database_name,
  current_user AS execution_role,
  current_schema() AS default_schema;

-- 2. Confirm the tables and columns required for activity context exist.
WITH required_columns(table_name, column_name) AS (
  VALUES
    ('thesis_audits', 'id'),
    ('thesis_audits', 'thesis_id'),
    ('thesis_audits', 'changed_by_user_id'),
    ('thesis_audits', 'event'),
    ('thesis_audits', 'change_description'),
    ('thesis_audits', 'updated_at'),
    ('theses', 'id'),
    ('theses', 'title'),
    ('users', 'id'),
    ('users', 'profile_name'),
    ('users', 'role'),
    ('users', 'deactivated_at')
)
SELECT
  required_columns.table_name,
  required_columns.column_name,
  columns.data_type,
  columns.is_nullable,
  columns.column_name IS NOT NULL AS column_exists
FROM required_columns
LEFT JOIN information_schema.columns AS columns
  ON columns.table_schema = 'public'
  AND columns.table_name = required_columns.table_name
  AND columns.column_name = required_columns.column_name
ORDER BY required_columns.table_name, required_columns.column_name;

-- 3. Inspect historic data quality. Non-zero fallback counts are not blockers;
-- the migration must retain those audit rows and show the documented fallback.
SELECT
  count(*) AS total_audits,
  count(*) FILTER (WHERE thesis.id IS NULL) AS audits_without_thesis,
  count(*) FILTER (WHERE actor.id IS NULL) AS audits_without_actor_profile,
  count(*) FILTER (
    WHERE NULLIF(btrim(thesis.title), '') IS NULL
  ) AS audits_with_blank_thesis_title,
  count(*) FILTER (
    WHERE NULLIF(btrim(actor.profile_name), '') IS NULL
  ) AS audits_with_blank_actor_name,
  count(*) FILTER (
    WHERE NULLIF(btrim(audit.change_description), '') IS NULL
  ) AS audits_with_blank_description,
  count(*) FILTER (WHERE audit.event IS NULL) AS audits_without_event
FROM public.thesis_audits AS audit
LEFT JOIN public.theses AS thesis ON thesis.id = audit.thesis_id
LEFT JOIN public.users AS actor ON actor.id = audit.changed_by_user_id;

-- 4. Inspect the active helper and dashboard RPC. Both must be SECURITY
-- DEFINER, callable by authenticated users, and have the fixed search path.
WITH required_rpc(label, signature) AS (
  VALUES
    (
      'active-account helper',
      'public.current_user_is_active(text[])'
    ),
    (
      'dashboard snapshot',
      'public.get_admin_dashboard_snapshot()'
    ),
    (
      'new paginated activity RPC',
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
  END AS authenticated_can_execute,
  CASE
    WHEN resolved_rpc.label = 'new paginated activity RPC'
      THEN resolved_rpc.function_oid IS NULL
    ELSE resolved_rpc.function_oid IS NOT NULL
  END AS expected_predeployment_state
FROM resolved_rpc
LEFT JOIN pg_proc AS procedure ON procedure.oid = resolved_rpc.function_oid
ORDER BY resolved_rpc.label;

-- 5. Inspect available indexes for the deterministic audit ordering and the
-- join keys. The migration may add a composite (updated_at DESC, id DESC)
-- index if this result does not already cover the desired order.
SELECT
  indexes.tablename,
  indexes.indexname,
  indexes.indexdef
FROM pg_indexes AS indexes
WHERE indexes.schemaname = 'public'
  AND indexes.tablename IN ('thesis_audits', 'theses', 'users')
ORDER BY indexes.tablename, indexes.indexname;

-- 6. Confirm RLS remains enabled and inspect the existing read policies.
-- The activity migration must not add broad direct table grants or relax RLS.
SELECT
  class.relname AS table_name,
  class.relrowsecurity AS rls_enabled,
  class.relforcerowsecurity AS rls_forced
FROM pg_class AS class
JOIN pg_namespace AS namespace ON namespace.oid = class.relnamespace
WHERE namespace.nspname = 'public'
  AND class.relname IN ('thesis_audits', 'theses', 'users')
ORDER BY class.relname;

SELECT
  policyname,
  tablename,
  cmd,
  roles,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('thesis_audits', 'theses', 'users')
ORDER BY tablename, policyname;
