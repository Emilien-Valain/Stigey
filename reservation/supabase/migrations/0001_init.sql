-- Schéma initial : Prestations, Disponibilités récurrentes, Indisponibilités,
-- Réglages, Réservations. Voir reservation/CONTEXT.md pour le glossaire et
-- reservation/docs/adr/0001, 0005, 0006 pour les décisions implémentées ici.

create extension if not exists pgcrypto;
create extension if not exists btree_gist;

create function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ============================================================= Prestations
create table prestations (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  duree_minutes int not null check (duree_minutes > 0),
  prix_centimes int not null check (prix_centimes >= 0),
  accroche text not null default '',
  description text not null default '',
  description_mobile text,
  cible text not null default '',
  badge text,
  image_url text not null default '',
  ordre int not null default 0,
  actif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger prestations_set_updated_at
  before update on prestations
  for each row execute function set_updated_at();

alter table prestations enable row level security;

create policy "prestations_public_read" on prestations
  for select to anon
  using (actif = true);

create policy "prestations_praticienne_all" on prestations
  for all to authenticated
  using (true)
  with check (true);

-- ============================================== Disponibilités récurrentes
create table disponibilites_recurrentes (
  jour_semaine smallint primary key check (jour_semaine between 0 and 6),
  ouvert boolean not null default false,
  heure_debut time not null default '09:00',
  heure_fin time not null default '18:00',
  check (heure_fin > heure_debut)
);

alter table disponibilites_recurrentes enable row level security;

create policy "dispos_public_read" on disponibilites_recurrentes
  for select to anon
  using (true);

create policy "dispos_praticienne_all" on disponibilites_recurrentes
  for all to authenticated
  using (true)
  with check (true);

-- ======================================================== Indisponibilités
create table indisponibilites (
  id uuid primary key default gen_random_uuid(),
  date_debut date not null,
  date_fin date not null,
  heure_debut time,
  heure_fin time,
  created_at timestamptz not null default now(),
  check (date_fin >= date_debut),
  check ((heure_debut is null) = (heure_fin is null)),
  check (heure_debut is null or date_debut = date_fin)
);

alter table indisponibilites enable row level security;

create policy "indispos_public_read" on indisponibilites
  for select to anon
  using (true);

create policy "indispos_praticienne_all" on indisponibilites
  for all to authenticated
  using (true)
  with check (true);

-- =================================================================== Réglages
create table reglages (
  id int primary key default 1 check (id = 1),
  battement_minutes int not null default 0 check (battement_minutes between 0 and 60)
);

alter table reglages enable row level security;

create policy "reglages_public_read" on reglages
  for select to anon
  using (true);

create policy "reglages_praticienne_all" on reglages
  for all to authenticated
  using (true)
  with check (true);

-- =============================================================== Réservations
create table reservations (
  id uuid primary key default gen_random_uuid(),
  praticienne_id uuid not null references auth.users (id),
  prestation_id uuid not null references prestations (id),
  nom text not null,
  email text not null,
  telephone text,
  jour date not null,
  heure_debut time not null,
  heure_fin time not null,
  statut text not null default 'confirmee'
    check (statut in ('confirmee', 'annulee', 'honoree', 'no_show')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (heure_fin > heure_debut),
  -- ADR-0001 : unicité atomique anti-sur-réservation, en base, pas en code
  -- applicatif. Une Annulation libère réellement le créneau (exclue du
  -- contrôle) ; Confirmée/Honorée/No-show bloquent toutes le créneau.
  exclude using gist (
    praticienne_id with =,
    tsrange(
      (jour + heure_debut)::timestamp,
      (jour + heure_fin)::timestamp,
      '[)'
    ) with &&
  ) where (statut <> 'annulee')
);

create trigger reservations_set_updated_at
  before update on reservations
  for each row execute function set_updated_at();

alter table reservations enable row level security;

-- Aucun accès direct anon : la création publique passe uniquement par la
-- fonction creer_reservation (SECURITY DEFINER) ci-dessous.
create policy "reservations_praticienne_all" on reservations
  for all to authenticated
  using (true)
  with check (true);

-- ======================================================= Fonction de réservation
create function creer_reservation(
  p_prestation_id uuid,
  p_praticienne_id uuid,
  p_jour date,
  p_heure_debut time,
  p_nom text,
  p_email text,
  p_telephone text
) returns reservations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_duree int;
  v_reservation reservations;
begin
  select duree_minutes into v_duree
  from prestations
  where id = p_prestation_id and actif = true;

  if v_duree is null then
    raise exception 'prestation_introuvable';
  end if;

  if coalesce(trim(p_nom), '') = '' or coalesce(trim(p_email), '') = '' then
    raise exception 'coordonnees_incompletes';
  end if;

  insert into reservations (
    praticienne_id, prestation_id, nom, email, telephone,
    jour, heure_debut, heure_fin, statut
  ) values (
    p_praticienne_id, p_prestation_id, trim(p_nom), trim(p_email), p_telephone,
    p_jour, p_heure_debut, p_heure_debut + (v_duree || ' minutes')::interval, 'confirmee'
  )
  returning * into v_reservation;

  return v_reservation;
end;
$$;

grant execute on function creer_reservation(uuid, uuid, date, time, text, text, text) to anon;

-- Anon n'a pas accès à la table reservations (vie privée des clientes — voir
-- policy ci-dessus), mais le calcul public des créneaux (ADR-0006) a besoin
-- de savoir quelles plages sont déjà occupées ce jour-là. Cette fonction
-- n'expose que jour/heures, jamais nom/email/téléphone.
create function creneaux_occupes_le(p_jour date)
returns table (heure_debut time, heure_fin time)
language sql
security definer
set search_path = public
stable
as $$
  select heure_debut, heure_fin
  from reservations
  where jour = p_jour and statut <> 'annulee';
$$;

grant execute on function creneaux_occupes_le(date) to anon;
