-- WARNING: This schema is for context only and is not meant to be run directly.
-- This reflects the reviewed target schema after the 2026-07-06 admin/backend
-- migration. It is a reference snapshot, not the deployable migration.
-- Table names are lowercase to match Supabase's actual stored identifiers.

-- users: single table for all authenticated users.
-- id = auth.users.id (UUID from Supabase Auth — matched via FK).
-- Supabase Auth owns password hashing, email verification, and JWT issuance.
-- role        = system access level
--                 admin:       manages users and role assignments
--                 moderator:   reviews and approves thesis submissions
--                 member:      registered user; can submit theses and access PDFs
-- affiliation = USC identity type (who the person is at USC, separate from role)
--                 student / alumni / professor
-- Trigger `on_auth_user_created` fires on auth.users INSERT and populates this table.
-- Migration note: if leaving Supabase Auth, add password_hash via ALTER TABLE
-- and issue force-password-resets to all existing users.
CREATE TABLE public.users (
  id           uuid NOT NULL,
  created_at   timestamp with time zone NOT NULL DEFAULT now(),
  email        text NOT NULL UNIQUE,
  profile_name text NOT NULL,
  usc_id       bigint,
  role         text NOT NULL DEFAULT 'member'::text
                 CHECK (role = ANY (ARRAY['admin'::text, 'moderator'::text, 'member'::text])),
  affiliation  text NOT NULL
                 CHECK (affiliation = ANY (ARRAY['student'::text, 'alumni'::text, 'professor'::text])),
  deactivated_at timestamp with time zone,
  deactivation_reason text,
  deactivated_by_user_id uuid,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT users_deactivated_by_user_id_fkey
    FOREIGN KEY (deactivated_by_user_id) REFERENCES public.users(id)
);

-- Trigger function: fires after every Supabase Auth signup.
-- Inserts a matching row into public.users automatically.
-- profile_name, usc_id, and affiliation are passed via raw_user_meta_data
-- from the frontend signUp() call.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, profile_name, usc_id, role, affiliation)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'profile_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'usc_id', '')::bigint,
    'member',
    COALESCE(NEW.raw_user_meta_data->>'affiliation', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- theses: core thesis record.
-- review_status lifecycle:
--   for_review -> flagged | accepted | trashed (admin only for trash)
--   flagged -> for_review only through member resubmission; staff may add feedback
--   accepted -> for_review (staff correction) | trashed (admin only)
--   trashed -> for_review (admin restore)
-- Only accepted records are publicly visible.
-- research_area is free text; frontend enforces a controlled dropdown list.
-- Distinct values power the filter dropdown via SELECT DISTINCT research_area.
-- recommendations and lessons_learned are free-form text fields (no structured sub-tables).
-- Uploaders paste or type these sections directly from their thesis document.
-- publication_date is required by the submission contract and cannot exceed
-- the current Asia/Manila calendar date.
-- year is derived from publication_date by the submission service and stored
-- separately for filtering/sorting. The submission RPC requires both years to match.
-- The live column remains nullable until existing rows are audited and a migration
-- can safely add NOT NULL plus a matching-year constraint.
-- submitted_by_user_id is nullable so legacy/imported theses do not need a fake owner.
-- Every new ordinary submission derives submitted_by_user_id from auth.uid(),
-- including submissions performed by an administrator.
CREATE TABLE public.theses (
  id               bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at       timestamp with time zone NOT NULL DEFAULT now(),
  updated_at       timestamp with time zone NOT NULL DEFAULT now(),
  title            text NOT NULL,
  abstract         text NOT NULL,
  department       text NOT NULL,
  year             integer NOT NULL,
  research_area    text,
  publication_link text,
  publication_date date,
  conference       text,
  submitted_by_user_id uuid,
  study_type       text NOT NULL DEFAULT 'thesis'::text
                     CHECK (study_type = ANY (ARRAY['thesis'::text, 'capstone'::text])),
  review_status    text NOT NULL DEFAULT 'for_review'::text
                     CHECK (review_status = ANY (ARRAY['for_review'::text, 'flagged'::text, 'accepted'::text, 'trashed'::text])),
  recommendations  text,
  lessons_learned  text,
  CONSTRAINT theses_pkey PRIMARY KEY (id),
  CONSTRAINT theses_submitted_by_user_id_fkey FOREIGN KEY (submitted_by_user_id) REFERENCES public.users(id)
);

-- thesis_files: stores the private Supabase Storage object path.
-- storage_path is canonical; nullable file_url remains temporarily for rollback.
-- Frontend DTOs expose guarded preview/download paths, never storage_path.
-- is_primary marks the main/current PDF for display; old files are retained for history.
-- Project rule: each thesis should have exactly one primary file for preview/download.
-- Initial submissions accept PDF only with a maximum object size of 10 MiB.
-- Supabase Storage must enforce application/pdf and the 10485760-byte limit.
CREATE TABLE public.thesis_files (
  id        bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  thesis_id bigint NOT NULL,
  file_url  text,
  storage_path text NOT NULL,
  file_type text NOT NULL DEFAULT 'application/pdf',
  is_primary boolean NOT NULL DEFAULT false,
  CONSTRAINT thesis_files_pkey PRIMARY KEY (id),
  CONSTRAINT thesis_files_thesis_id_fkey FOREIGN KEY (thesis_id) REFERENCES public.theses(id)
);

-- thesis_authors: credits people on a thesis (authors and advisers).
-- display_name is always required and stored here for stable display even if the linked
--   user account is later deleted or renamed.
-- user_id is nullable: unregistered authors/advisers (historical records, external collaborators)
--   are credited by display_name alone; registered users can be linked optionally.
-- contribution_role distinguishes authors from advisers without a separate table.
-- sort_order controls display order; authors are listed before advisers by convention.
-- ON DELETE SET NULL on user_id means deleting a user account does not destroy thesis credits.
CREATE TABLE public.thesis_authors (
  id                  bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  thesis_id           bigint NOT NULL,
  user_id             uuid,
  display_name        text NOT NULL,
  contribution_role   text NOT NULL
                        CHECK (contribution_role = ANY (ARRAY['author'::text, 'adviser'::text])),
  sort_order          integer,
  CONSTRAINT thesis_authors_pkey             PRIMARY KEY (id),
  CONSTRAINT thesis_authors_thesis_id_fkey   FOREIGN KEY (thesis_id) REFERENCES public.theses(id) ON DELETE CASCADE,
  CONSTRAINT thesis_authors_user_id_fkey     FOREIGN KEY (user_id)   REFERENCES public.users(id)  ON DELETE SET NULL
);

-- thesis_tags: free hashtag-style keywords assigned by contributors.
-- Used for search, filtering, and frontend-computed related thesis matching.
CREATE TABLE public.thesis_tags (
  id        bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  thesis_id bigint NOT NULL,
  tag       text NOT NULL,
  CONSTRAINT thesis_tags_pkey           PRIMARY KEY (id),
  CONSTRAINT thesis_tags_thesis_id_fkey FOREIGN KEY (thesis_id) REFERENCES public.theses(id)
);



-- thesis_audits: tracks moderator/admin actions on thesis records.
-- changed_by_user_id is required by the inspected live schema.
-- change_description is nullable; dashboard activity supplies a safe fallback.
CREATE TABLE public.thesis_audits (
  id                  bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  updated_at          timestamp with time zone NOT NULL DEFAULT now(),
  thesis_id           bigint NOT NULL,
  changed_by_user_id  uuid NOT NULL,
  change_description  text,
  CONSTRAINT thesis_audits_pkey                    PRIMARY KEY (id),
  CONSTRAINT thesis_audits_thesis_id_fkey          FOREIGN KEY (thesis_id)          REFERENCES public.theses(id),
  CONSTRAINT thesis_audits_changed_by_user_id_fkey FOREIGN KEY (changed_by_user_id) REFERENCES public.users(id)
);
