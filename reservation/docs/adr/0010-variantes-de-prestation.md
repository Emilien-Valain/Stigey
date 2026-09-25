# Variantes de prestation

Une même Prestation doit pouvoir se décliner en plusieurs **durées et prix** selon
un choix de la cliente (ex. « Coiffage » : tresses 1 h 30 à 60 €, chignon 1 h à
40 €). Avant, une Prestation portait une seule durée et un seul prix.

## Décisions

- **Une Variante remplace, elle ne s'ajoute pas.** Table `variantes_prestations`
  (nom, durée, prix, ordre, actif), rattachée à une Prestation. Une Prestation est
  soit **simple** (durée et prix propres, comme avant), soit **à variantes** (≥ 2
  Variantes actives, `duree_minutes` / `prix_centimes` de la Prestation à `NULL`).
  Les deux colonnes vont ensemble (`check`). Une Variante seule n'a pas de sens :
  elle est refusée (`variantes_insuffisantes`).
- **Choix obligatoire.** `creer_reservation` refuse une Prestation à variantes sans
  Variante valide, et une Variante donnée à une Prestation simple (`variante_invalide`) :
  la règle est en base, pas seulement dans le tunnel.
- **Deux modèles cohabitent** (Prestation simple / à variantes) plutôt que « toute
  Prestation a ≥ 1 Variante » : aucune migration de données, aucun changement pour
  l'existant. La lecture passe par un point unique, `tarifDe` / `resumeTarifs`
  (`catalogue.ts`), pour que le reste du code ignore la distinction.
- **Instantané sur la Réservation.** `reservations.variante_id` (nullable),
  `variante_nom` et `prix_centimes` sont figés à la création ; la durée reste portée
  par `heure_fin`, jamais recalculée. Modifier ou désactiver une Variante ne réécrit
  donc aucune Réservation existante. Une Variante se **désactive**, elle ne se supprime
  pas (pas de `DELETE` accordé), comme les Prestations et Catégories (ADR-0008).
- **Enregistrement atomique** : `enregistrer_prestation` (SECURITY INVOKER) écrit la
  Prestation et sa liste **complète** de Variantes, dans l'ordre voulu, en une
  transaction — un échec ne laisse jamais une Prestation sans tarif. Les Variantes
  absentes de la liste sont désactivées ; l'ordre est la position dans la liste
  (pas de `reordonner_variantes` séparé).
- **Report** : la durée est celle de la Variante réservée si elle est encore active ;
  sinon (Variante désactivée) on garde la durée déjà réservée.
- **Affichage** : cartes « à partir de 40 € · 1 h – 1 h 30 » (accueil, Prestations,
  tunnel) ; le détail des Variantes est sur la page Prestations et dans le tunnel, qui
  insère le choix d'option **dans l'étape « Le soin »** (avant le calendrier, car la
  durée conditionne les créneaux). Le nom devient « Coiffage – Chignon » dans les
  e-mails, l'.ics et l'admin ; le prix figé apparaît dans le détail admin.

## Tests (ADR-0007)

`variantes.integration.test.ts` (Postgres réel : atomicité, choix obligatoire, durée
et prix pris sur la Variante, instantané, RLS/GRANT), `catalogue.test.ts`
(`tarifDe`, `resumeTarifs`), `validation.test.ts`, `db-erreurs.test.ts`.
