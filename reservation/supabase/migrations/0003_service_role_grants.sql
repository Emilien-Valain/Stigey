-- service_role bypasses RLS but still needs the base table GRANT (disabled
-- by "Automatically expose new tables" at project creation, same cause as
-- 0002_grants.sql). Without this, server-side code using the service client
-- (src/lib/supabase/service.ts — the rappels cron) gets "permission denied"
-- even though RLS would otherwise be bypassed.

grant usage on schema public to service_role;
grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
grant all privileges on all functions in schema public to service_role;

-- Cover future tables too, so this doesn't need repeating.
alter default privileges in schema public grant all privileges on tables to service_role;
alter default privileges in schema public grant all privileges on sequences to service_role;
alter default privileges in schema public grant all privileges on functions to service_role;
