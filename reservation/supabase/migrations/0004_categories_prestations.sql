-- Catégories de prestations, ordre réglable par la praticienne et mise en
-- avant d'un soin. Voir reservation/CONTEXT.md (Catégorie, Mise en avant) et
-- reservation/docs/adr/0008-categories-ordre-mise-en-avant.md.

-- ================================================================ Catégories
create table categories_prestations (
  id uuid primary key default gen_random_uuid(),
  nom text not null check (length(btrim(nom)) between 1 and 80),
  ordre int not null default 0,
  actif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger categories_prestations_set_updated_at
  before update on categories_prestations
  for each row execute function set_updated_at();

alter table categories_prestations enable row level security;

create policy "categories_public_read" on categories_prestations
  for select to anon
  using (actif = true);

create policy "categories_praticienne_all" on categories_prestations
  for all to authenticated
  using (true)
  with check (true);

grant select on categories_prestations to anon;
grant select, insert, update, delete on categories_prestations to authenticated;

-- ================================================ Colonnes sur les prestations
alter table prestations add column categorie_id uuid references categories_prestations (id);
alter table prestations add column mise_en_avant boolean not null default false;

-- Reprise des données existantes : une catégorie par défaut reçoit tous les
-- soins déjà en base, et un ancien badge devient une mise en avant.
do $$
declare
  v_categorie uuid;
begin
  if exists (select 1 from prestations) then
    insert into categories_prestations (nom, ordre) values ('Nos soins', 1)
    returning id into v_categorie;
    update prestations set categorie_id = v_categorie, mise_en_avant = (badge is not null);
  end if;
end;
$$;

alter table prestations alter column categorie_id set not null;
alter table prestations drop column badge;

-- =================================================== Ordre et cohérence (triggers)
-- Un nouvel élément (ordre laissé à 0) se place à la fin ; un soin qui change
-- de catégorie se place à la fin de la nouvelle.
create function categories_prestations_ordre_fin() returns trigger as $$
begin
  if new.ordre = 0 then
    new.ordre = coalesce((select max(ordre) from categories_prestations), 0) + 1;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger categories_prestations_ordre_fin
  before insert on categories_prestations
  for each row execute function categories_prestations_ordre_fin();

create function prestations_ordre_et_categorie() returns trigger as $$
begin
  if new.actif and not (select actif from categories_prestations where id = new.categorie_id) then
    raise exception 'categorie_inactive';
  end if;

  if tg_op = 'INSERT' and new.ordre = 0
     or tg_op = 'UPDATE' and new.categorie_id is distinct from old.categorie_id then
    new.ordre = coalesce(
      (select max(ordre) from prestations where categorie_id = new.categorie_id), 0
    ) + 1;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger prestations_ordre_et_categorie
  before insert or update on prestations
  for each row execute function prestations_ordre_et_categorie();

-- Une catégorie ne se désactive pas tant qu'elle contient des soins actifs :
-- aucun soin ne doit disparaître du site par effet de bord.
create function categories_prestations_verifier_desactivation() returns trigger as $$
begin
  if old.actif and not new.actif
     and exists (select 1 from prestations where categorie_id = new.id and actif) then
    raise exception 'categorie_non_vide';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger categories_prestations_verifier_desactivation
  before update on categories_prestations
  for each row execute function categories_prestations_verifier_desactivation();

-- ================================================================ Réordonnancement
-- Le client envoie l'ordre complet ; tout est appliqué en un seul UPDATE
-- (atomique). Un ordre incomplet ou contenant un intrus est refusé : on
-- n'écrase jamais partiellement l'ordre de la praticienne. SECURITY INVOKER :
-- la RLS s'applique, et l'EXECUTE est retiré au public (défense en profondeur).
create function reordonner_categories(p_ids uuid[]) returns void
language plpgsql
set search_path = public
as $$
begin
  if (select count(*) from categories_prestations where actif and id = any (p_ids))
       <> cardinality(p_ids)
     or (select count(*) from categories_prestations where actif) <> cardinality(p_ids) then
    raise exception 'ordre_incomplet';
  end if;

  update categories_prestations c
  set ordre = t.position
  from unnest(p_ids) with ordinality as t (id, position)
  where c.id = t.id;
end;
$$;

create function reordonner_prestations(p_categorie_id uuid, p_ids uuid[]) returns void
language plpgsql
set search_path = public
as $$
begin
  if (select count(*) from prestations
        where actif and categorie_id = p_categorie_id and id = any (p_ids))
       <> cardinality(p_ids)
     or (select count(*) from prestations where actif and categorie_id = p_categorie_id)
       <> cardinality(p_ids) then
    raise exception 'ordre_incomplet';
  end if;

  update prestations p
  set ordre = t.position
  from unnest(p_ids) with ordinality as t (id, position)
  where p.id = t.id;
end;
$$;

revoke execute on function reordonner_categories(uuid[]) from public, anon;
revoke execute on function reordonner_prestations(uuid, uuid[]) from public, anon;
grant execute on function reordonner_categories(uuid[]) to authenticated;
grant execute on function reordonner_prestations(uuid, uuid[]) to authenticated;
