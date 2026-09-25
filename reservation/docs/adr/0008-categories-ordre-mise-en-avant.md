# Catégories de prestations, ordre réglable et mise en avant

La praticienne doit pouvoir **regrouper ses Prestations en Catégories**, **choisir
l'ordre** des Catégories et des Prestations, et **mettre un soin en valeur**. Le
catalogue n'est plus une liste plate de 3-4 soins figée par la migration initiale.

## Décisions

- **Table `categories_prestations`** (nom, ordre, actif), et `prestations.categorie_id`
  obligatoire. Comme pour les Prestations, on **désactive** au lieu de supprimer
  (les Réservations passées gardent leur FK, voir ADR-0001).
- **Suppression refusée si la Catégorie contient des soins actifs**, portée par un
  trigger Postgres (`categorie_non_vide`) et non par le code applicatif : aucun soin
  ne disparaît du site par effet de bord, même via un appel direct.
- **Ordre = colonne `ordre`, réécrite atomiquement** par `reordonner_categories` /
  `reordonner_prestations` (un seul `UPDATE`). Le client envoie l'ordre **complet** ;
  un ordre incomplet ou contenant un intrus est refusé (`ordre_incomplet`), pour ne
  jamais écraser partiellement l'ordre de la praticienne (deux onglets, page périmée).
  Un nouvel élément se place **à la fin**.
- **Mise en avant = booléen `mise_en_avant`**, plusieurs possibles. Il remplace `badge`
  (texte libre) ; la migration reprend `badge non nul → mise_en_avant = true`. Le libellé
  affiché est fixe (« Coup de cœur »), donc plus de texte libre à modérer.
- **Réordonner par boutons monter/descendre**, pas par glisser-déposer : accessible au
  clavier et au tactile, aucune dépendance (bundle et free tier, ADR-0004).

## Sécurité

Les Server Actions sont joignables en POST direct (doc Next.js « data-security »).
Chaque action du catalogue : (1) **revérifie la session** (`getUser()`, pas
`getSession()`), (2) **valide l'entrée côté serveur** (`validation.ts` : uuid, bornes,
types), (3) laisse la **RLS** en dernier rempart, (4) ne renvoie **que** `{ error? }`
avec un message métier — jamais l'erreur SQL brute. Les fonctions de réordonnancement
n'ont pas d'`EXECUTE` pour `anon`.

## Tests (ADR-0007)

Seams : base Postgres réelle (`catalogue.integration.test.ts`, rôles `anon` /
`authenticated` endossés pour éprouver RLS et GRANT), logique pure
(`catalogue.test.ts`), validation et messages d'erreur (`validation.test.ts`,
`db-erreurs.test.ts`), plus un E2E du parcours admin.

## Option écartée

**Glisser-déposer** : plus intuitif visuellement, mais dépendance supplémentaire et
fallback clavier à écrire ; les boutons couvrent un catalogue de quelques dizaines
d'éléments au plus.
