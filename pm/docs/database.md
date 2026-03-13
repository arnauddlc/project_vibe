# Database Approach

This project uses SQLite for a simple local data store. The database is created automatically if it does not exist.

## Scope (MVP)
- Multiple users are supported at the data layer.
- One board per user (enforced by a unique `boards.user_id`).
- Columns are fixed in count but can be renamed.
- Cards belong to a single column and can be moved.

## Ordering
- Columns and cards use an integer `position` field.
- Lower `position` appears first.
- Reordering can be implemented by re-sequencing positions within the affected column(s).

## Identifiers and timestamps
- All primary keys are `TEXT` (intended for UUIDs).
- Column and card IDs are globally unique across boards.
- `created_at` and `updated_at` are stored as ISO-8601 strings.

## Schema Source
- JSON schema definition: `docs/db-schema.json`.
