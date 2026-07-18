-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.theses (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  title text NOT NULL,
  abstract text NOT NULL,
  department text NOT NULL,
  year integer NOT NULL,
  research_area text CHECK (research_area IS NULL OR research_area_ids_are_valid(research_area)),
  publication_link text,
  publication_date date,
  review_status text NOT NULL DEFAULT 'for_review'::text CHECK (review_status = ANY (ARRAY['for_review'::text, 'flagged'::text, 'accepted'::text, 'trashed'::text])),
  recommendations text,
  lessons_learned text,
  submitted_by_user_id uuid,
  conference text,
  study_type text NOT NULL DEFAULT 'thesis'::text CHECK (study_type = ANY (ARRAY['thesis'::text, 'capstone'::text])),
  CONSTRAINT theses_pkey PRIMARY KEY (id),
  CONSTRAINT theses_submitted_by_user_id_fkey FOREIGN KEY (submitted_by_user_id) REFERENCES public.users(id)
);
CREATE TABLE public.thesis_files (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  thesis_id bigint NOT NULL,
  file_url text,
  is_primary boolean NOT NULL DEFAULT false,
  file_type text NOT NULL DEFAULT 'application/pdf'::text,
  storage_path text NOT NULL,
  CONSTRAINT thesis_files_pkey PRIMARY KEY (id),
  CONSTRAINT thesis_files_thesis_id_fkey FOREIGN KEY (thesis_id) REFERENCES public.theses(id)
);
CREATE TABLE public.thesis_tags (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  thesis_id bigint NOT NULL,
  tag text NOT NULL,
  CONSTRAINT thesis_tags_pkey PRIMARY KEY (id),
  CONSTRAINT thesis_tags_thesis_id_fkey FOREIGN KEY (thesis_id) REFERENCES public.theses(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  email text NOT NULL UNIQUE,
  profile_name text NOT NULL,
  usc_id bigint,
  role text NOT NULL DEFAULT 'member'::text CHECK (role = ANY (ARRAY['admin'::text, 'moderator'::text, 'member'::text])),
  affiliation text NOT NULL CHECK (affiliation = ANY (ARRAY['student'::text, 'alumni'::text, 'professor'::text])),
  deactivated_at timestamp with time zone,
  deactivation_reason text,
  deactivated_by_user_id uuid,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_deactivated_by_user_id_fkey FOREIGN KEY (deactivated_by_user_id) REFERENCES public.users(id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.thesis_audits (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  thesis_id bigint NOT NULL,
  changed_by_user_id uuid NOT NULL,
  change_description text,
  event text CHECK (event IS NULL OR (event = ANY (ARRAY['submitted'::text, 'comment_added'::text, 'comment_addressed'::text, 'status_changed'::text, 'metadata_edited'::text, 'pdf_replaced'::text, 'resubmitted'::text]))),
  CONSTRAINT thesis_audits_pkey PRIMARY KEY (id),
  CONSTRAINT thesis_audits_thesis_id_fkey FOREIGN KEY (thesis_id) REFERENCES public.theses(id),
  CONSTRAINT thesis_audits_changed_by_user_id_fkey FOREIGN KEY (changed_by_user_id) REFERENCES public.users(id)
);
CREATE TABLE public.thesis_authors (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  thesis_id bigint NOT NULL,
  user_id uuid,
  display_name text NOT NULL,
  contribution_role text NOT NULL CHECK (contribution_role = ANY (ARRAY['author'::text, 'adviser'::text])),
  sort_order integer,
  CONSTRAINT thesis_authors_pkey PRIMARY KEY (id),
  CONSTRAINT thesis_authors_thesis_id_fkey FOREIGN KEY (thesis_id) REFERENCES public.theses(id),
  CONSTRAINT thesis_authors_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.thesis_review_comments (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  thesis_id bigint NOT NULL,
  field_key text NOT NULL CHECK (field_key = ANY (ARRAY['title'::text, 'authors'::text, 'advisers'::text, 'department'::text, 'study_type'::text, 'publication_date'::text, 'publication_link'::text, 'conference'::text, 'research_area'::text, 'tags'::text, 'abstract'::text, 'recommendations'::text, 'lessons_learned'::text, 'pdf_general'::text])),
  comment text NOT NULL,
  created_by_user_id uuid NOT NULL,
  addressed_at timestamp with time zone,
  addressed_by_user_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  member_revised_at timestamp with time zone,
  CONSTRAINT thesis_review_comments_pkey PRIMARY KEY (id),
  CONSTRAINT thesis_review_comments_thesis_id_fkey FOREIGN KEY (thesis_id) REFERENCES public.theses(id),
  CONSTRAINT thesis_review_comments_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.users(id),
  CONSTRAINT thesis_review_comments_addressed_by_user_id_fkey FOREIGN KEY (addressed_by_user_id) REFERENCES public.users(id)
);