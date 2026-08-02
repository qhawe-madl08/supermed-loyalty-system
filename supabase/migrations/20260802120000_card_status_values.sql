-- ============================================================================
-- Add the card inventory states used by the staff workflow.
--
-- Purpose
--   Supermed's cards are pre-printed and generic (SM000001, SM000002...), so a
--   card must be able to exist before any customer is attached to it. The MVP
--   lifecycle is AVAILABLE -> ASSIGNED -> DISABLED.
--
-- Why this is its own migration
--   Postgres does not allow a newly added enum value to be USED in the same
--   transaction that adds it. The columns and indexes that reference these
--   values are therefore in the next migration.
--
-- Rollback
--   Enum values cannot be dropped in Postgres. Leaving them unused is harmless.
--
-- Manual execution
--   supabase db push   (or paste into the Supabase SQL editor)
-- ============================================================================

alter type card_status add value if not exists 'available';
alter type card_status add value if not exists 'assigned';
alter type card_status add value if not exists 'disabled';
