-- Données de développement local (chargées par `supabase db reset` / `supabase start`).
-- Ne PAS rejouer tel quel sur un projet Supabase hébergé : le compte praticienne
-- y est créé via le dashboard Supabase (Authentication > Users), pas par ce
-- script. Mot de passe ci-dessous volontairement faible et public : à changer
-- avant toute mise en service réelle.

-- ============================================================ Compte praticienne
-- uuid fixe pour rester stable d'un `db reset` à l'autre.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, last_sign_in_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) values (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-4111-8111-111111111111',
  'authenticated',
  'authenticated',
  'praticienne@stigey.fr',
  crypt('stigey-dev-2026', gen_salt('bf')),
  now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Sonia Bah"}',
  now(), now(),
  '', '', '', ''
);

insert into auth.identities (
  id, user_id, identity_data, provider, provider_id,
  last_sign_in_at, created_at, updated_at
) values (
  gen_random_uuid(),
  '11111111-1111-4111-8111-111111111111',
  '{"sub":"11111111-1111-4111-8111-111111111111","email":"praticienne@stigey.fr"}',
  'email',
  '11111111-1111-4111-8111-111111111111',
  now(), now(), now()
);

-- ================================================================= Prestations
insert into prestations (id, nom, duree_minutes, prix_centimes, accroche, description, description_mobile, cible, badge, image_url, ordre) values
  ('00000000-0000-4000-8000-000000000001', 'Diagnostic du cuir chevelu', 60, 4000,
   'Pour comprendre votre cuir chevelu et votre texture avant tout soin.',
   'Un temps d''échange, une observation attentive du cuir chevelu et de la fibre, puis les axes de travail et la routine à mettre en place. Le diagnostic est déduit du prix de votre premier soin.',
   'Un temps d''échange, une observation attentive du cuir chevelu et de la fibre, puis les axes de travail et la routine à mettre en place.',
   'un premier rendez-vous, ou une problématique qu''on n''a jamais vraiment élucidée.',
   null, '/images/soin-serum-cuir-chevelu.jpg', 1),
  ('00000000-0000-4000-8000-000000000002', 'Head spa signature', 75, 7500,
   'L''expérience complète : détente profonde et rééquilibrage, des cervicales au cuir chevelu.',
   'Le rituel complet : nettoyage en profondeur, massage du cuir chevelu, des cervicales et des épaules, soin adapté à votre texture et séchage doux. On ne regarde pas l''heure.',
   'Le rituel complet : nettoyage en profondeur, massage du cuir chevelu, des cervicales et des épaules, soin adapté et séchage doux.',
   'envie de relâcher vraiment, tout en faisant du bien à son cuir chevelu.',
   'Le plus demandé', '/images/head-spa-bac.jpg', 2),
  ('00000000-0000-4000-8000-000000000003', 'Soin apaisant — cuir sensible', 45, 6000,
   'Pour les cuirs chevelus réactifs, irrités ou sujets aux démangeaisons.',
   'Gestes très doux, formules sans parfum et températures maîtrisées pour calmer les inconforts et laisser le cuir chevelu respirer.',
   null,
   'cuirs chevelus réactifs, tiraillements, démangeaisons.',
   null, '/images/fleur-eau.jpg', 3),
  ('00000000-0000-4000-8000-000000000004', 'Soin profond cheveux texturés', 90, 8500,
   'Hydratation et nutrition pour boucles, crépus et locks.',
   'Hydratation intense, nutrition et démêlage patient : un soin pensé pour les boucles, les cheveux crépus et les locks.',
   null,
   'cheveux secs, poreux, en transition ou en protection.',
   null, '/images/cheveux-textures.jpg', 4);

-- ================================================ Disponibilités récurrentes
-- Horaires réels affichés sur /contact : mar-ven 10h-19h, sam 9h-17h, dim+lun fermé.
insert into disponibilites_recurrentes (jour_semaine, ouvert, heure_debut, heure_fin) values
  (0, false, '09:00', '18:00'), -- dimanche
  (1, false, '09:00', '18:00'), -- lundi
  (2, true,  '10:00', '19:00'), -- mardi
  (3, true,  '10:00', '19:00'), -- mercredi
  (4, true,  '10:00', '19:00'), -- jeudi
  (5, true,  '10:00', '19:00'), -- vendredi
  (6, true,  '09:00', '17:00'); -- samedi

-- ========================================================================= Réglages
insert into reglages (id, battement_minutes) values (1, 0);

-- =============================================================== Réservations démo
insert into reservations (praticienne_id, prestation_id, nom, email, telephone, jour, heure_debut, heure_fin, statut) values
  ('11111111-1111-4111-8111-111111111111', '00000000-0000-4000-8000-000000000002', 'Aïssatou Diallo', 'aissatou.diallo@mail.fr', '06 42 18 77 03', current_date, '09:00', '10:15', 'confirmee'),
  ('11111111-1111-4111-8111-111111111111', '00000000-0000-4000-8000-000000000003', 'Clara Meunier', 'clara.meunier@mail.fr', '07 88 24 51 66', current_date, '10:45', '11:30', 'confirmee'),
  ('11111111-1111-4111-8111-111111111111', '00000000-0000-4000-8000-000000000001', 'Fatou Camara', 'fatou.camara@mail.fr', '06 15 39 02 48', current_date, '12:00', '13:00', 'honoree'),
  ('11111111-1111-4111-8111-111111111111', '00000000-0000-4000-8000-000000000004', 'Léa Bonnard', 'lea.bonnard@mail.fr', '06 71 55 12 90', current_date, '14:30', '16:00', 'confirmee'),
  ('11111111-1111-4111-8111-111111111111', '00000000-0000-4000-8000-000000000002', 'Nadia Ben Salem', 'nadia.bensalem@mail.fr', '07 61 04 83 22', current_date, '16:30', '17:45', 'confirmee'),
  ('11111111-1111-4111-8111-111111111111', '00000000-0000-4000-8000-000000000001', 'Salimata Traoré', 'salimata.traore@mail.fr', '06 42 18 77 03', current_date + 1, '09:30', '10:30', 'confirmee'),
  ('11111111-1111-4111-8111-111111111111', '00000000-0000-4000-8000-000000000002', 'Élodie Rieu', 'elodie.rieu@mail.fr', '07 88 24 51 66', current_date + 1, '11:00', '12:15', 'confirmee'),
  ('11111111-1111-4111-8111-111111111111', '00000000-0000-4000-8000-000000000004', 'Awa Sylla', 'awa.sylla@mail.fr', '06 15 39 02 48', current_date + 2, '14:00', '15:30', 'confirmee'),
  ('11111111-1111-4111-8111-111111111111', '00000000-0000-4000-8000-000000000003', 'Marion Delaunay', 'm.delaunay@mail.fr', '06 71 55 12 90', current_date + 2, '16:00', '16:45', 'annulee'),
  ('11111111-1111-4111-8111-111111111111', '00000000-0000-4000-8000-000000000002', 'Kadiatou Bah', 'kadiatou.bah@mail.fr', '07 61 04 83 22', current_date + 6, '09:00', '10:15', 'confirmee'),
  ('11111111-1111-4111-8111-111111111111', '00000000-0000-4000-8000-000000000001', 'Inès Fabre', 'ines.fabre@mail.fr', '06 22 47 19 05', current_date - 5, '09:00', '10:00', 'honoree'),
  ('11111111-1111-4111-8111-111111111111', '00000000-0000-4000-8000-000000000002', 'Sophie Marchand', 's.marchand@mail.fr', '07 09 63 40 71', current_date - 5, '11:00', '12:15', 'no_show'),
  ('11111111-1111-4111-8111-111111111111', '00000000-0000-4000-8000-000000000004', 'Rokia Konaté', 'rokia.konate@mail.fr', '06 84 12 55 37', current_date - 8, '15:00', '16:30', 'honoree');

-- ============================================================= Indisponibilité démo
insert into indisponibilites (date_debut, date_fin, heure_debut, heure_fin) values
  (current_date + 10, current_date + 10, null, null);
