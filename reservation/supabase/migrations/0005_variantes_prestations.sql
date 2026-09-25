-- Variantes de prestation : une même Prestation décline plusieurs durées/prix
-- (ex. Coiffage : 1 h à 40 € ou 1 h 30 à 60 € selon la coiffure choisie).
-- Voir reservation/CONTEXT.md (Variante) et
-- reservation/docs/adr/0010-variantes-de-prestation.md.

-- ================================================================== Variantes
create table variantes_prestations (
  id uuid primary key default gen_random_uuid(),
  prestation_id uuid not null references prestations (id),
  nom text not null check (length(btrim(nom)) between 1 and 80),
  duree_minutes int not null check (duree_minutes > 0),
  prix_centimes int not null check (prix_centimes >= 0),
  ordre int not null default 0,
  actif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index variantes_prestations_prestation_idx
  on variantes_prestations (prestation_id, ordre);

create trigger variantes_prestations_set_updated_at
  before update on variantes_prestations
  for each row execute function set_updated_at();

alter table variantes_prestations enable row level security;

create policy "variantes_public_read" on variantes_prestations
  for select to anon
  using (actif = true);

create policy "variantes_praticienne_all" on variantes_prestations
  for all to authenticated
  using (true)
  with check (true);

-- Pas de DELETE : une Variante se désactive, les Réservations la référencent.
grant select on variantes_prestations to anon;
grant select, insert, update on variantes_prestations to authenticated;

-- ============================== Prestation « à variantes » : plus de durée/prix
-- Une Prestation qui a des Variantes actives n'a plus de durée ni de prix
-- propres (NULL). Les deux vont ensemble : l'un sans l'autre est incohérent.
alter table prestations alter column duree_minutes drop not null;
alter table prestations alter column prix_centimes drop not null;
alter table prestations add constraint prestations_duree_prix_ensemble
  check ((duree_minutes is null) = (prix_centimes is null));

-- ===================================== Variante choisie + instantané (Réservation)
-- variante_nom / prix_centimes sont figés à la création : modifier ou
-- désactiver une Variante ne réécrit jamais une Réservation existante.
alter table reservations add column variante_id uuid references variantes_prestations (id);
alter table reservations add column variante_nom text;
alter table reservations add column prix_centimes int;

-- ============================================================ creer_reservation
-- Nouvelle signature (p_variante_id) : l'ancienne est retirée pour ne pas
-- laisser un chemin de réservation qui ignorerait les Variantes.
drop function creer_reservation(uuid, uuid, date, time, text, text, text);

create function creer_reservation(
  p_prestation_id uuid,
  p_praticienne_id uuid,
  p_jour date,
  p_heure_debut time,
  p_nom text,
  p_email text,
  p_telephone text,
  p_variante_id uuid default null
) returns reservations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_duree int;
  v_prix int;
  v_variante_nom text;
  v_a_des_variantes boolean;
  v_reservation reservations;
begin
  select duree_minutes, prix_centimes into v_duree, v_prix
  from prestations
  where id = p_prestation_id and actif = true;

  if not found then
    raise exception 'prestation_introuvable';
  end if;

  select exists (
    select 1 from variantes_prestations
    where prestation_id = p_prestation_id and actif = true
  ) into v_a_des_variantes;

  if v_a_des_variantes then
    -- Choix obligatoire, et la Variante doit appartenir à cette Prestation.
    select duree_minutes, prix_centimes, nom into v_duree, v_prix, v_variante_nom
    from variantes_prestations
    where id = p_variante_id and prestation_id = p_prestation_id and actif = true;

    if not found then
      raise exception 'variante_invalide';
    end if;
  elsif p_variante_id is not null then
    raise exception 'variante_invalide';
  end if;

  if v_duree is null then
    raise exception 'prestation_introuvable';
  end if;

  if coalesce(trim(p_nom), '') = '' or coalesce(trim(p_email), '') = '' then
    raise exception 'coordonnees_incompletes';
  end if;

  insert into reservations (
    praticienne_id, prestation_id, variante_id, variante_nom, prix_centimes,
    nom, email, telephone, jour, heure_debut, heure_fin, statut
  ) values (
    p_praticienne_id, p_prestation_id, p_variante_id, v_variante_nom, v_prix,
    trim(p_nom), trim(p_email), p_telephone,
    p_jour, p_heure_debut, p_heure_debut + (v_duree || ' minutes')::interval, 'confirmee'
  )
  returning * into v_reservation;

  return v_reservation;
end;
$$;

grant execute on function creer_reservation(uuid, uuid, date, time, text, text, text, uuid) to anon;

-- ======================================================== enregistrer_prestation
-- Enregistre une Prestation ET ses Variantes en une seule transaction : un
-- échec en cours de route ne laisse jamais une Prestation sans durée ni prix
-- et sans Variante. `p_variantes` est la liste complète, dans l'ordre voulu
-- par la praticienne ([{id?, nom, duree_minutes, prix_centimes}]) :
--   * vide  -> Prestation simple (durée et prix propres) ; ses Variantes
--             éventuelles sont toutes désactivées ;
--   * ≥ 2   -> Prestation à variantes (durée et prix propres remis à NULL) ;
--             les Variantes absentes de la liste sont désactivées.
-- Une seule Variante n'a pas de sens (ce serait une Prestation simple).
-- SECURITY INVOKER : la RLS et les GRANT de la praticienne s'appliquent.
create function enregistrer_prestation(
  p_id uuid,
  p_donnees jsonb,
  p_variantes jsonb default '[]'::jsonb
) returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_id uuid := p_id;
  v_nb int := coalesce(jsonb_array_length(p_variantes), 0);
  v_duree int := case when v_nb = 0 then (p_donnees ->> 'duree_minutes')::int end;
  v_prix int := case when v_nb = 0 then (p_donnees ->> 'prix_centimes')::int end;
  v_variante record;
begin
  if v_nb = 1 then
    raise exception 'variantes_insuffisantes';
  end if;
  if v_nb = 0 and (v_duree is null or v_prix is null) then
    raise exception 'duree_prix_requis';
  end if;

  if v_id is null then
    insert into prestations (
      nom, categorie_id, duree_minutes, prix_centimes, accroche, description,
      cible, mise_en_avant, image_url
    ) values (
      p_donnees ->> 'nom', (p_donnees ->> 'categorie_id')::uuid, v_duree, v_prix,
      p_donnees ->> 'accroche', p_donnees ->> 'description', p_donnees ->> 'cible',
      (p_donnees ->> 'mise_en_avant')::boolean, p_donnees ->> 'image_url'
    ) returning id into v_id;
  else
    update prestations set
      nom = p_donnees ->> 'nom',
      categorie_id = (p_donnees ->> 'categorie_id')::uuid,
      duree_minutes = v_duree,
      prix_centimes = v_prix,
      accroche = p_donnees ->> 'accroche',
      description = p_donnees ->> 'description',
      cible = p_donnees ->> 'cible',
      mise_en_avant = (p_donnees ->> 'mise_en_avant')::boolean,
      image_url = p_donnees ->> 'image_url'
    where id = v_id;
    if not found then
      raise exception 'prestation_introuvable';
    end if;
  end if;

  -- Variantes retirées de la liste : désactivées, jamais supprimées.
  update variantes_prestations set actif = false
  where prestation_id = v_id
    and actif
    and id not in (
      select (e ->> 'id')::uuid
      from jsonb_array_elements(p_variantes) as e
      where e ->> 'id' is not null
    );

  for v_variante in
    select e as donnees, o as position
    from jsonb_array_elements(p_variantes) with ordinality as t (e, o)
  loop
    if v_variante.donnees ->> 'id' is null then
      insert into variantes_prestations (prestation_id, nom, duree_minutes, prix_centimes, ordre)
      values (
        v_id,
        v_variante.donnees ->> 'nom',
        (v_variante.donnees ->> 'duree_minutes')::int,
        (v_variante.donnees ->> 'prix_centimes')::int,
        v_variante.position
      );
    else
      update variantes_prestations set
        nom = v_variante.donnees ->> 'nom',
        duree_minutes = (v_variante.donnees ->> 'duree_minutes')::int,
        prix_centimes = (v_variante.donnees ->> 'prix_centimes')::int,
        ordre = v_variante.position,
        actif = true
      where id = (v_variante.donnees ->> 'id')::uuid and prestation_id = v_id;
      if not found then
        raise exception 'variante_introuvable';
      end if;
    end if;
  end loop;

  return v_id;
end;
$$;

revoke execute on function enregistrer_prestation(uuid, jsonb, jsonb) from public, anon;
grant execute on function enregistrer_prestation(uuid, jsonb, jsonb) to authenticated;
