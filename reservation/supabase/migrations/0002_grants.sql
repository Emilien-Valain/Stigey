-- Table-level GRANTs matching the RLS policies from 0001_init.sql.
-- Needed because the project has "Automatically expose new tables" disabled
-- (Data API setting) — RLS policies alone don't grant access; Postgres still
-- checks the underlying table GRANT first.

grant usage on schema public to anon, authenticated;

grant select on prestations to anon;
grant select, insert, update, delete on prestations to authenticated;

grant select on disponibilites_recurrentes to anon;
grant select, insert, update, delete on disponibilites_recurrentes to authenticated;

grant select on indisponibilites to anon;
grant select, insert, update, delete on indisponibilites to authenticated;

grant select on reglages to anon;
grant select, insert, update, delete on reglages to authenticated;

grant select, insert, update, delete on reservations to authenticated;
