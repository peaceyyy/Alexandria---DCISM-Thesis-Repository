# Sub-phase 03: Service Types and Result Envelope

Owner: Homer
Mode: Planning first, implementation later

## Goal

Create the shared TypeScript types that frontend pages and backend services both trust.

## Future Files

- `Alexandria/lib/services/types.ts`
- `Alexandria/lib/services/result.ts`

## Types To Include

- `ReviewStatus`
- `UserRole`
- `Affiliation`
- `ContributionRole`
- `ThesisAuthor`
- `ThesisCard`
- `ThesisDetail`
- `FilterOptions`
- `CurrentUser`
- `AdminThesisRow`
- `UserAdminRow`
- `ValidationErrorList`
- `ServiceResult<T>`
- `ServiceError`
- `PaginationMeta`

## Rules

- Use `number` for thesis, tag, file, audit, and thesis author IDs.
- Use `string` UUIDs only for user IDs.
- Keep DB row types separate from UI DTOs.
- Do not expose raw `file_url` in public DTOs.

## Exit Criteria

- Frontend can import DTOs without depending on Supabase row shape.
- All services can return `ServiceResult<T>`.
- Validation errors can be displayed field-by-field.
