CREATE OR REPLACE FUNCTION public.submit_thesis_transaction(payload jsonb)
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
    DECLARE
        new_thesis_id int;
        author jsonb;
        tag text;
    BEGIN
        -- 1. Insert Thesis
        INSERT INTO theses (
            title, abstract, year, department, research_area,
            publication_date, publication_link, conference,
            recommendations, lessons_learned, submitted_by_user_id,
            review_status, study_type
        )
        VALUES (
            payload->>'title',
            payload->>'abstract',
            (payload->>'year')::int,
            payload->>'department',
            payload->>'research_area',
            NULLIF(payload->>'publication_date', '')::date,
            NULLIF(payload->>'publication_link', ''),
            NULLIF(payload->>'conference', ''),
            NULLIF(payload->>'recommendations', ''),
            NULLIF(payload->>'lessons_learned', ''),
            (payload->>'submitted_by_user_id')::uuid,
            'for_review',
            COALESCE(payload->>'study_type', 'thesis')
        )
        RETURNING id INTO new_thesis_id;

        -- 2. Insert Authors
        IF jsonb_typeof(payload->'authors') = 'array' THEN
            FOR author IN SELECT * FROM jsonb_array_elements(payload->'authors')
            LOOP
                INSERT INTO thesis_authors (
                    thesis_id, user_id, display_name, contribution_role, sort_order
                )
                VALUES (
                    new_thesis_id,
                    NULLIF(author->>'user_id', '')::uuid,
                    author->>'display_name',
                    author->>'contribution_role',
                    (author->>'sort_order')::int
                );
            END LOOP;
        END IF;

        -- 3. Insert Tags
        IF jsonb_typeof(payload->'tags') = 'array' THEN
            FOR tag IN SELECT * FROM jsonb_array_elements_text(payload->'tags')
            LOOP
                INSERT INTO thesis_tags (thesis_id, tag)
                VALUES (new_thesis_id, tag);
            END LOOP;
        END IF;

        -- 4. Insert File Metadata
        IF payload->>'file_url' IS NOT NULL THEN
            INSERT INTO thesis_files (
                thesis_id, file_url, file_type, is_primary
            )
            VALUES (
                new_thesis_id,
                payload->>'file_url',
                COALESCE(payload->>'file_type', 'application/pdf'),
                true
            );
        END IF;

        -- Return the ID of the new thesis
        RETURN new_thesis_id;

    EXCEPTION WHEN OTHERS THEN
        -- If any error occurs, the transaction is automatically rolled back by Postgres
        RAISE;
    END;
$function$;
