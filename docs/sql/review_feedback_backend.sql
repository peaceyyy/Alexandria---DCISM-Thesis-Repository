-- Alexandria review-feedback backend migration.
-- Target: field-level moderator feedback plus member correction loop.
-- Apply only after human review. This script is additive and keeps PDF
-- annotation/email automation out of the MVP path.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Audit event typing
-- ---------------------------------------------------------------------------

ALTER TABLE public.thesis_audits
  ADD COLUMN IF NOT EXISTS event text;

ALTER TABLE public.thesis_audits
  ADD COLUMN IF NOT EXISTS change_details jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'thesis_audits_event_check'
      AND conrelid = 'public.thesis_audits'::regclass
  ) THEN
    ALTER TABLE public.thesis_audits
      ADD CONSTRAINT thesis_audits_event_check
      CHECK (
        event IS NULL
        OR event = ANY (
          ARRAY[
            'submitted'::text,
            'comment_added'::text,
            'comment_addressed'::text,
            'status_changed'::text,
            'metadata_edited'::text,
            'pdf_replaced'::text,
            'resubmitted'::text
          ]
        )
      );
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS thesis_audits_thesis_updated_at_idx
  ON public.thesis_audits (thesis_id, updated_at DESC, id DESC);

-- ---------------------------------------------------------------------------
-- 2. Field-level review comments
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.thesis_review_comments (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  thesis_id bigint NOT NULL,
  field_key text NOT NULL,
  comment text NOT NULL,
  created_by_user_id uuid NOT NULL,
  addressed_at timestamp with time zone,
  addressed_by_user_id uuid,
  member_revised_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT thesis_review_comments_pkey PRIMARY KEY (id),
  CONSTRAINT thesis_review_comments_thesis_id_fkey
    FOREIGN KEY (thesis_id) REFERENCES public.theses(id) ON DELETE CASCADE,
  CONSTRAINT thesis_review_comments_created_by_user_id_fkey
    FOREIGN KEY (created_by_user_id) REFERENCES public.users(id),
  CONSTRAINT thesis_review_comments_addressed_by_user_id_fkey
    FOREIGN KEY (addressed_by_user_id) REFERENCES public.users(id),
  CONSTRAINT thesis_review_comments_field_key_check
    CHECK (
      field_key = ANY (
        ARRAY[
          'title'::text,
          'authors'::text,
          'advisers'::text,
          'department'::text,
          'study_type'::text,
          'publication_date'::text,
          'publication_link'::text,
          'research_area'::text,
          'tags'::text,
          'abstract'::text,
          'recommendations'::text,
          'lessons_learned'::text,
          'pdf_general'::text
        ]
      )
    )
);

ALTER TABLE public.thesis_review_comments
  ADD COLUMN IF NOT EXISTS member_revised_at timestamp with time zone;

ALTER TABLE public.thesis_review_comments
  DROP CONSTRAINT IF EXISTS thesis_review_comments_field_key_check;

ALTER TABLE public.thesis_review_comments
  ADD CONSTRAINT thesis_review_comments_field_key_check
  CHECK (
    field_key = ANY (
      ARRAY[
        'title'::text,
        'authors'::text,
        'advisers'::text,
        'department'::text,
        'study_type'::text,
        'publication_date'::text,
        'publication_link'::text,
        'conference'::text,
        'research_area'::text,
        'tags'::text,
        'abstract'::text,
        'recommendations'::text,
        'lessons_learned'::text,
        'pdf_general'::text
      ]
    )
  );

CREATE INDEX IF NOT EXISTS thesis_review_comments_thesis_created_at_idx
  ON public.thesis_review_comments (thesis_id, created_at, id);

CREATE INDEX IF NOT EXISTS thesis_review_comments_thesis_field_idx
  ON public.thesis_review_comments (thesis_id, field_key);

DROP INDEX IF EXISTS thesis_review_comments_open_idx;
CREATE INDEX thesis_review_comments_open_idx
  ON public.thesis_review_comments (thesis_id)
  WHERE member_revised_at IS NULL;

CREATE INDEX IF NOT EXISTS thesis_review_comments_field_revision_idx
  ON public.thesis_review_comments (thesis_id, field_key, member_revised_at);

-- ---------------------------------------------------------------------------
-- 3. Transactional review RPCs
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.add_review_comment(
  target_thesis_id bigint,
  target_field_key text,
  comment_body text
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  new_comment_id bigint;
  normalized_comment text;
  current_status text;
BEGIN
  IF NOT public.current_user_is_active(ARRAY['admin', 'moderator']) THEN
    RAISE EXCEPTION 'An active administrator or moderator account is required'
      USING ERRCODE = '42501';
  END IF;

  normalized_comment := NULLIF(btrim(comment_body), '');
  IF normalized_comment IS NULL THEN
    RAISE EXCEPTION 'A review comment is required'
      USING ERRCODE = '22023';
  END IF;

  IF target_field_key NOT IN (
    'title',
    'authors',
    'advisers',
    'department',
    'study_type',
    'publication_date',
    'publication_link',
    'conference',
    'research_area',
    'tags',
    'abstract',
    'recommendations',
    'lessons_learned',
    'pdf_general'
  ) THEN
    RAISE EXCEPTION 'That review field cannot be commented on'
      USING ERRCODE = '22023';
  END IF;

  SELECT review_status
  INTO current_status
  FROM public.theses
  WHERE id = target_thesis_id
  FOR UPDATE;

  IF current_status IS NULL THEN
    RAISE EXCEPTION 'Thesis was not found'
      USING ERRCODE = 'P0002';
  END IF;

  IF current_status NOT IN ('for_review', 'flagged') THEN
    RAISE EXCEPTION 'Comments can only be added while a submission is under review'
      USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.thesis_review_comments (
    thesis_id,
    field_key,
    comment,
    created_by_user_id
  )
  VALUES (
    target_thesis_id,
    target_field_key,
    normalized_comment,
    auth.uid()
  )
  RETURNING id INTO new_comment_id;

  INSERT INTO public.thesis_audits (
    thesis_id,
    changed_by_user_id,
    event,
    change_description
  )
  VALUES (
    target_thesis_id,
    auth.uid(),
    'comment_added',
    'Review comment added to ' || target_field_key || '.'
  );

  RETURN new_comment_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_review_status(
  target_thesis_id bigint,
  next_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  current_status text;
BEGIN
  IF NOT public.current_user_is_active(ARRAY['admin', 'moderator']) THEN
    RAISE EXCEPTION 'An active administrator or moderator account is required'
      USING ERRCODE = '42501';
  END IF;

  IF next_status NOT IN ('for_review', 'flagged', 'accepted', 'trashed') THEN
    RAISE EXCEPTION 'That review status transition is not allowed'
      USING ERRCODE = '22023';
  END IF;

  SELECT review_status
  INTO current_status
  FROM public.theses
  WHERE id = target_thesis_id
  FOR UPDATE;

  IF current_status IS NULL THEN
    RAISE EXCEPTION 'Thesis was not found'
      USING ERRCODE = 'P0002';
  END IF;

  IF next_status = 'trashed'
    AND NOT public.current_user_is_active(ARRAY['admin'])
  THEN
    RAISE EXCEPTION 'Only administrators can move a submission to trash'
      USING ERRCODE = '42501';
  END IF;

  IF NOT (
    current_status = 'for_review'
    AND next_status IN ('flagged', 'accepted', 'trashed')
  ) AND NOT (
    current_status = 'accepted'
    AND next_status = 'for_review'
  ) AND NOT (
    current_status = 'accepted'
    AND next_status = 'trashed'
  ) AND NOT (
    current_status = 'flagged'
    AND next_status = 'trashed'
  ) AND NOT (
    current_status = 'trashed'
    AND next_status = 'for_review'
    AND public.current_user_is_active(ARRAY['admin'])
  ) THEN
    RAISE EXCEPTION 'That review status transition is not allowed'
      USING ERRCODE = '22023';
  END IF;

  IF next_status = 'flagged'
    AND NOT EXISTS (
      SELECT 1
      FROM public.thesis_review_comments
      WHERE thesis_id = target_thesis_id
        AND member_revised_at IS NULL
    )
  THEN
    RAISE EXCEPTION 'Add at least one review comment before flagging a submission for revision'
      USING ERRCODE = '22023';
  END IF;

  IF current_status = next_status THEN
    RETURN;
  END IF;

  UPDATE public.theses
  SET
    review_status = next_status,
    updated_at = now()
  WHERE id = target_thesis_id;

  INSERT INTO public.thesis_audits (
    thesis_id,
    changed_by_user_id,
    event,
    change_description
  )
  VALUES (
    target_thesis_id,
    auth.uid(),
    'status_changed',
    'Review status changed from ' || current_status || ' to ' || next_status || '.'
  );
END;
$$;

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

  IF payload ? 'department'
    AND payload->>'department' NOT IN ('CS', 'IT', 'IS')
  THEN
    RAISE EXCEPTION 'Department must be CS, IT, or IS'
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
    research_area = CASE WHEN payload ? 'research_area' THEN NULLIF(payload->>'research_area', '') ELSE research_area END,
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
    jsonb_build_object(
      'reason', btrim(correction_reason),
      'before', before_details,
      'after', after_details
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.update_flagged_submission(
  target_thesis_id bigint,
  payload jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  owner_id uuid;
  current_status text;
  current_thesis public.theses%ROWTYPE;
  current_calendar_date date;
  next_publication_date date;
  next_study_type text;
  author jsonb;
  tag text;
  changed_fields text[] := ARRAY[]::text[];
  current_authors jsonb;
  next_authors jsonb;
  current_advisers jsonb;
  next_advisers jsonb;
  current_tags jsonb;
  next_tags jsonb;
BEGIN
  IF auth.uid() IS NULL OR NOT public.current_user_is_active(ARRAY['member']) THEN
    RAISE EXCEPTION 'An active member account is required'
      USING ERRCODE = '42501';
  END IF;

  IF jsonb_typeof(payload) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'Submission changes must be an object'
      USING ERRCODE = '22023';
  END IF;

  SELECT *
  INTO current_thesis
  FROM public.theses
  WHERE id = target_thesis_id
  FOR UPDATE;

  owner_id := current_thesis.submitted_by_user_id;
  current_status := current_thesis.review_status;

  IF current_status IS NULL THEN
    RAISE EXCEPTION 'Thesis was not found'
      USING ERRCODE = 'P0002';
  END IF;

  IF owner_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'You are not the owner of this thesis'
      USING ERRCODE = '42501';
  END IF;

  IF current_status <> 'flagged' THEN
    RAISE EXCEPTION 'Only flagged submissions can be edited by members'
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

  IF payload ? 'department'
    AND payload->>'department' NOT IN ('CS', 'IT', 'IS')
  THEN
    RAISE EXCEPTION 'Department must be CS, IT, or IS'
      USING ERRCODE = '22023';
  END IF;

  IF payload ? 'title' AND payload->>'title' IS DISTINCT FROM current_thesis.title THEN
    changed_fields := array_append(changed_fields, 'title');
  END IF;
  IF payload ? 'abstract' AND payload->>'abstract' IS DISTINCT FROM current_thesis.abstract THEN
    changed_fields := array_append(changed_fields, 'abstract');
  END IF;
  IF payload ? 'department' AND payload->>'department' IS DISTINCT FROM current_thesis.department THEN
    changed_fields := array_append(changed_fields, 'department');
  END IF;
  IF payload ? 'research_area'
    AND NULLIF(payload->>'research_area', '') IS DISTINCT FROM current_thesis.research_area
  THEN
    changed_fields := array_append(changed_fields, 'research_area');
  END IF;
  IF payload ? 'publication_date' AND next_publication_date IS DISTINCT FROM current_thesis.publication_date THEN
    changed_fields := array_append(changed_fields, 'publication_date');
  END IF;
  IF payload ? 'publication_link'
    AND NULLIF(payload->>'publication_link', '') IS DISTINCT FROM current_thesis.publication_link
  THEN
    changed_fields := array_append(changed_fields, 'publication_link');
  END IF;
  IF payload ? 'conference'
    AND NULLIF(payload->>'conference', '') IS DISTINCT FROM current_thesis.conference
  THEN
    changed_fields := array_append(changed_fields, 'conference');
  END IF;
  IF payload ? 'recommendations'
    AND NULLIF(payload->>'recommendations', '') IS DISTINCT FROM current_thesis.recommendations
  THEN
    changed_fields := array_append(changed_fields, 'recommendations');
  END IF;
  IF payload ? 'lessons_learned'
    AND NULLIF(payload->>'lessons_learned', '') IS DISTINCT FROM current_thesis.lessons_learned
  THEN
    changed_fields := array_append(changed_fields, 'lessons_learned');
  END IF;
  IF payload ? 'study_type' AND next_study_type IS DISTINCT FROM current_thesis.study_type THEN
    changed_fields := array_append(changed_fields, 'study_type');
  END IF;

  IF payload ? 'authors' THEN
    IF jsonb_typeof(payload->'authors') IS DISTINCT FROM 'array'
      OR jsonb_array_length(payload->'authors') = 0
    THEN
      RAISE EXCEPTION 'At least one thesis author is required'
        USING ERRCODE = '22023';
    END IF;

    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'user_id', COALESCE(user_id::text, ''),
          'display_name', btrim(display_name),
          'sort_order', COALESCE(sort_order, 0)
        )
        ORDER BY COALESCE(sort_order, 0), id
      ),
      '[]'::jsonb
    )
    INTO current_authors
    FROM public.thesis_authors
    WHERE thesis_id = target_thesis_id
      AND contribution_role = 'author';

    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'user_id', COALESCE(input_entry->>'user_id', ''),
          'display_name', btrim(input_entry->>'display_name'),
          'sort_order', COALESCE(NULLIF(input_entry->>'sort_order', '')::integer, 0)
        )
        ORDER BY COALESCE(NULLIF(input_entry->>'sort_order', '')::integer, 0), btrim(input_entry->>'display_name')
      ),
      '[]'::jsonb
    )
    INTO next_authors
    FROM jsonb_array_elements(payload->'authors') AS input_entry
    WHERE input_entry->>'contribution_role' = 'author';

    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'user_id', COALESCE(user_id::text, ''),
          'display_name', btrim(display_name),
          'sort_order', COALESCE(sort_order, 0)
        )
        ORDER BY COALESCE(sort_order, 0), id
      ),
      '[]'::jsonb
    )
    INTO current_advisers
    FROM public.thesis_authors
    WHERE thesis_id = target_thesis_id
      AND contribution_role = 'adviser';

    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'user_id', COALESCE(input_entry->>'user_id', ''),
          'display_name', btrim(input_entry->>'display_name'),
          'sort_order', COALESCE(NULLIF(input_entry->>'sort_order', '')::integer, 0)
        )
        ORDER BY COALESCE(NULLIF(input_entry->>'sort_order', '')::integer, 0), btrim(input_entry->>'display_name')
      ),
      '[]'::jsonb
    )
    INTO next_advisers
    FROM jsonb_array_elements(payload->'authors') AS input_entry
    WHERE input_entry->>'contribution_role' = 'adviser';

    IF current_authors IS DISTINCT FROM next_authors THEN
      changed_fields := array_append(changed_fields, 'authors');
    END IF;
    IF current_advisers IS DISTINCT FROM next_advisers THEN
      changed_fields := array_append(changed_fields, 'advisers');
    END IF;
  END IF;

  IF payload ? 'tags' THEN
    IF jsonb_typeof(payload->'tags') IS DISTINCT FROM 'array'
      OR jsonb_array_length(payload->'tags') = 0
    THEN
      RAISE EXCEPTION 'At least one tag is required'
        USING ERRCODE = '22023';
    END IF;

    SELECT COALESCE(jsonb_agg(btrim(existing_tag.tag) ORDER BY btrim(existing_tag.tag)), '[]'::jsonb)
    INTO current_tags
    FROM public.thesis_tags AS existing_tag
    WHERE existing_tag.thesis_id = target_thesis_id;

    SELECT COALESCE(jsonb_agg(btrim(input_tag.value) ORDER BY btrim(input_tag.value)), '[]'::jsonb)
    INTO next_tags
    FROM jsonb_array_elements_text(payload->'tags') AS input_tag(value);

    IF current_tags IS DISTINCT FROM next_tags THEN
      changed_fields := array_append(changed_fields, 'tags');
    END IF;
  END IF;

  UPDATE public.theses
  SET
    title = CASE WHEN payload ? 'title' THEN payload->>'title' ELSE title END,
    abstract = CASE WHEN payload ? 'abstract' THEN payload->>'abstract' ELSE abstract END,
    department = CASE WHEN payload ? 'department' THEN payload->>'department' ELSE department END,
    research_area = CASE WHEN payload ? 'research_area' THEN NULLIF(payload->>'research_area', '') ELSE research_area END,
    publication_date = CASE WHEN payload ? 'publication_date' THEN next_publication_date ELSE publication_date END,
    year = CASE
      WHEN payload ? 'publication_date'
        THEN EXTRACT(YEAR FROM next_publication_date)::integer
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
    DELETE FROM public.thesis_authors
    WHERE thesis_id = target_thesis_id;

    FOR author IN
      SELECT *
      FROM jsonb_array_elements(payload->'authors')
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
        thesis_id,
        user_id,
        display_name,
        contribution_role,
        sort_order
      )
      VALUES (
        target_thesis_id,
        NULLIF(author->>'user_id', '')::uuid,
        btrim(author->>'display_name'),
        author->>'contribution_role',
        NULLIF(author->>'sort_order', '')::integer
      );
    END LOOP;
  END IF;

  IF payload ? 'tags' THEN
    DELETE FROM public.thesis_tags
    WHERE thesis_id = target_thesis_id;

    FOR tag IN
      SELECT *
      FROM jsonb_array_elements_text(payload->'tags')
    LOOP
      IF NULLIF(btrim(tag), '') IS NOT NULL THEN
        INSERT INTO public.thesis_tags (thesis_id, tag)
        VALUES (target_thesis_id, btrim(tag));
      END IF;
    END LOOP;
  END IF;

  IF cardinality(changed_fields) > 0 THEN
    UPDATE public.thesis_review_comments
    SET member_revised_at = now()
    WHERE thesis_id = target_thesis_id
      AND field_key = ANY(changed_fields)
      AND created_at <= now();
  END IF;

  INSERT INTO public.thesis_audits (
    thesis_id,
    changed_by_user_id,
    event,
    change_description
  )
  VALUES (
    target_thesis_id,
    auth.uid(),
    'metadata_edited',
    'Submitter updated flagged submission fields.'
  );
END;
$$;

DROP FUNCTION IF EXISTS public.mark_review_comment_addressed(bigint, bigint);

CREATE OR REPLACE FUNCTION public.replace_flagged_submission_file(
  target_thesis_id bigint,
  target_storage_path text,
  target_file_type text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  owner_id uuid;
  current_status text;
BEGIN
  IF auth.uid() IS NULL OR NOT public.current_user_is_active(ARRAY['member']) THEN
    RAISE EXCEPTION 'An active member account is required'
      USING ERRCODE = '42501';
  END IF;

  SELECT submitted_by_user_id, review_status
  INTO owner_id, current_status
  FROM public.theses
  WHERE id = target_thesis_id
  FOR UPDATE;

  IF current_status IS NULL THEN
    RAISE EXCEPTION 'Thesis was not found'
      USING ERRCODE = 'P0002';
  END IF;

  IF owner_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'You are not the owner of this thesis'
      USING ERRCODE = '42501';
  END IF;

  IF current_status <> 'flagged' THEN
    RAISE EXCEPTION 'Only flagged submissions can replace their PDF'
      USING ERRCODE = '42501';
  END IF;

  IF target_file_type IS DISTINCT FROM 'application/pdf' THEN
    RAISE EXCEPTION 'Thesis file type must be application/pdf'
      USING ERRCODE = '22023';
  END IF;

  IF target_storage_path IS NULL
    OR target_storage_path NOT LIKE ('uploads/' || auth.uid()::text || '/%')
  THEN
    RAISE EXCEPTION 'The uploaded file path must belong to the authenticated user'
      USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM storage.objects
    WHERE bucket_id = 'thesis_files_bucket'
      AND name = target_storage_path
  ) THEN
    RAISE EXCEPTION 'The uploaded thesis PDF was not found in Storage'
      USING ERRCODE = '22023';
  END IF;

  UPDATE public.thesis_files
  SET is_primary = false
  WHERE thesis_id = target_thesis_id
    AND is_primary;

  INSERT INTO public.thesis_files (
    thesis_id,
    file_url,
    storage_path,
    file_type,
    is_primary
  )
  VALUES (
    target_thesis_id,
    NULL,
    target_storage_path,
    target_file_type,
    true
  );

  UPDATE public.thesis_review_comments
  SET member_revised_at = now()
  WHERE thesis_id = target_thesis_id
    AND field_key = 'pdf_general'
    AND created_at <= now();

  INSERT INTO public.thesis_audits (
    thesis_id,
    changed_by_user_id,
    event,
    change_description
  )
  VALUES (
    target_thesis_id,
    auth.uid(),
    'pdf_replaced',
    'Submitter reattached the primary PDF while correcting a flagged submission.'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.save_flagged_submission_correction(
  target_thesis_id bigint,
  payload jsonb,
  target_storage_path text,
  target_file_type text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF (target_storage_path IS NULL) <> (target_file_type IS NULL) THEN
    RAISE EXCEPTION 'A corrected PDF path and file type must be provided together'
      USING ERRCODE = '22023';
  END IF;

  -- Both calls execute in this RPC's transaction. If the PDF replacement
  -- fails, the metadata update and its audit entry are rolled back as well.
  PERFORM public.update_flagged_submission(target_thesis_id, payload);

  IF target_storage_path IS NOT NULL THEN
    PERFORM public.replace_flagged_submission_file(
      target_thesis_id,
      target_storage_path,
      target_file_type
    );
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.resubmit_flagged_submission(
  target_thesis_id bigint
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  owner_id uuid;
  current_status text;
BEGIN
  IF auth.uid() IS NULL OR NOT public.current_user_is_active(ARRAY['member']) THEN
    RAISE EXCEPTION 'An active member account is required'
      USING ERRCODE = '42501';
  END IF;

  SELECT submitted_by_user_id, review_status
  INTO owner_id, current_status
  FROM public.theses
  WHERE id = target_thesis_id
  FOR UPDATE;

  IF current_status IS NULL THEN
    RAISE EXCEPTION 'Thesis was not found'
      USING ERRCODE = 'P0002';
  END IF;

  IF owner_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'You are not the owner of this thesis'
      USING ERRCODE = '42501';
  END IF;

  IF current_status <> 'flagged' THEN
    RAISE EXCEPTION 'Only flagged submissions can be resubmitted'
      USING ERRCODE = '42501';
  END IF;

  UPDATE public.theses
  SET
    review_status = 'for_review',
    updated_at = now()
  WHERE id = target_thesis_id;

  INSERT INTO public.thesis_audits (
    thesis_id,
    changed_by_user_id,
    event,
    change_description
  )
  VALUES (
    target_thesis_id,
    auth.uid(),
    'resubmitted',
    'Submitter resubmitted the thesis for review.'
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- 4. Grants and row-level security
-- ---------------------------------------------------------------------------

ALTER TABLE public.thesis_review_comments ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.thesis_review_comments FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLE public.thesis_review_comments
  FROM authenticated;

GRANT SELECT ON TABLE public.thesis_review_comments TO authenticated;

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

DROP POLICY IF EXISTS active_account_required
  ON public.thesis_review_comments;
CREATE POLICY active_account_required
  ON public.thesis_review_comments
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING (public.current_user_is_active())
  WITH CHECK (public.current_user_is_active());

DROP POLICY IF EXISTS active_users_read_own_audits
  ON public.thesis_audits;
CREATE POLICY active_users_read_own_audits
  ON public.thesis_audits
  FOR SELECT
  TO authenticated
  USING (
    public.current_user_is_active()
    AND EXISTS (
      SELECT 1
      FROM public.theses AS thesis
      WHERE thesis.id = thesis_audits.thesis_id
        AND thesis.submitted_by_user_id = auth.uid()
    )
  );

REVOKE ALL ON FUNCTION public.add_review_comment(bigint, text, text)
  FROM PUBLIC;
REVOKE ALL ON FUNCTION public.add_review_comment(bigint, text, text)
  FROM anon;
GRANT EXECUTE ON FUNCTION public.add_review_comment(bigint, text, text)
  TO authenticated;

REVOKE ALL ON FUNCTION public.set_review_status(bigint, text)
  FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_review_status(bigint, text)
  FROM anon;
GRANT EXECUTE ON FUNCTION public.set_review_status(bigint, text)
  TO authenticated;

REVOKE ALL ON FUNCTION public.admin_update_submission_metadata(bigint, jsonb, text)
  FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_update_submission_metadata(bigint, jsonb, text)
  FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_update_submission_metadata(bigint, jsonb, text)
  TO authenticated;

REVOKE ALL ON FUNCTION public.update_flagged_submission(bigint, jsonb)
  FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_flagged_submission(bigint, jsonb)
  FROM anon;
GRANT EXECUTE ON FUNCTION public.update_flagged_submission(bigint, jsonb)
  TO authenticated;

REVOKE ALL ON FUNCTION public.replace_flagged_submission_file(bigint, text, text)
  FROM PUBLIC;
REVOKE ALL ON FUNCTION public.replace_flagged_submission_file(bigint, text, text)
  FROM anon;
GRANT EXECUTE ON FUNCTION public.replace_flagged_submission_file(bigint, text, text)
  TO authenticated;

REVOKE ALL ON FUNCTION public.save_flagged_submission_correction(bigint, jsonb, text, text)
  FROM PUBLIC;
REVOKE ALL ON FUNCTION public.save_flagged_submission_correction(bigint, jsonb, text, text)
  FROM anon;
GRANT EXECUTE ON FUNCTION public.save_flagged_submission_correction(bigint, jsonb, text, text)
  TO authenticated;

REVOKE ALL ON FUNCTION public.resubmit_flagged_submission(bigint)
  FROM PUBLIC;
REVOKE ALL ON FUNCTION public.resubmit_flagged_submission(bigint)
  FROM anon;
GRANT EXECUTE ON FUNCTION public.resubmit_flagged_submission(bigint)
  TO authenticated;

COMMIT;
