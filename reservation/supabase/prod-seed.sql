-- Données réelles à charger UNE FOIS sur le projet Supabase hébergé (prod),
-- via Dashboard > SQL Editor. Généré depuis supabase/seed.sql en retirant :
--   - le bloc auth.users/auth.identities (compte praticienne créé à la main
--     via Dashboard > Authentication > Users, avec un vrai mot de passe)
--   - les réservations et l'indisponibilité de démo (fausses clientes)
-- Le catalogue de prestations, les horaires récurrents et les réglages sont
-- la config réelle du salon : à garder.

-- ================================================================= Catégories
insert into categories_prestations (id, nom, ordre) values
  ('00000000-0000-4000-8000-0000000000c1', 'Nos soins', 1);

-- ================================================================= Prestations
insert into prestations (id, nom, duree_minutes, prix_centimes, accroche, description, description_mobile, cible, categorie_id, mise_en_avant, image_url, ordre) values
  ('00000000-0000-4000-8000-000000000001', 'Diagnostic du cuir chevelu', 60, 4000,
   'Pour comprendre votre cuir chevelu et votre texture avant tout soin.',
   'Un temps d''échange, une observation attentive du cuir chevelu et de la fibre, puis les axes de travail et la routine à mettre en place. Le diagnostic est déduit du prix de votre premier soin.',
   'Un temps d''échange, une observation attentive du cuir chevelu et de la fibre, puis les axes de travail et la routine à mettre en place.',
   'un premier rendez-vous, ou une problématique qu''on n''a jamais vraiment élucidée.',
   '00000000-0000-4000-8000-0000000000c1', false, '/images/soin-serum-cuir-chevelu.jpg', 1),
  ('00000000-0000-4000-8000-000000000002', 'Head spa signature', 75, 7500,
   'L''expérience complète : détente profonde et rééquilibrage, des cervicales au cuir chevelu.',
   'Le rituel complet : nettoyage en profondeur, massage du cuir chevelu, des cervicales et des épaules, soin adapté à votre texture et séchage doux. On ne regarde pas l''heure.',
   'Le rituel complet : nettoyage en profondeur, massage du cuir chevelu, des cervicales et des épaules, soin adapté et séchage doux.',
   'envie de relâcher vraiment, tout en faisant du bien à son cuir chevelu.',
   '00000000-0000-4000-8000-0000000000c1', true, '/images/head-spa-bac.jpg', 2),
  ('00000000-0000-4000-8000-000000000003', 'Soin apaisant — cuir sensible', 45, 6000,
   'Pour les cuirs chevelus réactifs, irrités ou sujets aux démangeaisons.',
   'Gestes très doux, formules sans parfum et températures maîtrisées pour calmer les inconforts et laisser le cuir chevelu respirer.',
   null,
   'cuirs chevelus réactifs, tiraillements, démangeaisons.',
   '00000000-0000-4000-8000-0000000000c1', false, '/images/fleur-eau.jpg', 3),
  ('00000000-0000-4000-8000-000000000004', 'Soin profond cheveux texturés', 90, 8500,
   'Hydratation et nutrition pour boucles, crépus et locks.',
   'Hydratation intense, nutrition et démêlage patient : un soin pensé pour les boucles, les cheveux crépus et les locks.',
   null,
   'cheveux secs, poreux, en transition ou en protection.',
   '00000000-0000-4000-8000-0000000000c1', false, '/images/cheveux-textures.jpg', 4);

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
