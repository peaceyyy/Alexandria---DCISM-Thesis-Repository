-- Read-only verification for staff_direct_publish_backend.sql.
-- Run after the modifying script commits successfully.

SELECT jsonb_pretty(
  jsonb_build_object(
    'audit_change_details_column', (
      SELECT jsonb_build_object(
        'exists', count(*) = 1,
        'type', max(data_type)
      )
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'thesis_audits'
        AND column_name = 'change_details'
    ),

    'staff_publish_rpc', (
      SELECT COALESCE(
        jsonb_build_object(
          'signature', format('public.%s(%s)', proc.proname, pg_get_function_identity_arguments(proc.oid)),
          'definition', pg_get_functiondef(proc.oid),
          'acl', COALESCE(proc.proacl::text[], ARRAY[]::text[])
        ),
        '{}'::jsonb
      )
      FROM pg_proc AS proc
      JOIN pg_namespace AS ns ON ns.oid = proc.pronamespace
      WHERE ns.nspname = 'public'
        AND proc.proname = 'publish_staff_thesis_transaction'
        AND pg_get_function_identity_arguments(proc.oid) = 'payload jsonb'
    ),

    'staff_metadata_edit_rpc', (
      SELECT COALESCE(
        jsonb_build_object(
          'signature', format('public.%s(%s)', proc.proname, pg_get_function_identity_arguments(proc.oid)),
          'definition', pg_get_functiondef(proc.oid),
          'acl', COALESCE(proc.proacl::text[], ARRAY[]::text[])
        ),
        '{}'::jsonb
      )
      FROM pg_proc AS proc
      JOIN pg_namespace AS ns ON ns.oid = proc.pronamespace
      WHERE ns.nspname = 'public'
        AND proc.proname = 'admin_update_submission_metadata'
        AND pg_get_function_identity_arguments(proc.oid) = 'target_thesis_id bigint, payload jsonb, correction_reason text'
    )
  )
);
