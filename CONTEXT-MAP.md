# Stigey — Carte des contextes

Stigey regroupe **deux projets distincts** de la même praticienne (head spa à
dimension clinique). Ce sont des *bounded contexts* séparés : ils ne partagent ni
modèle de domaine, ni base de données, ni plateforme. Un terme peut être légitime
dans l'un et proscrit dans l'autre (ex. « Produit » : première classe côté
Boutique, `_Avoid_` côté Réservation).

## Contextes

- **Réservation** — `reservation/`
  Moteur de réservation custom pour le head spa (Next.js, free tier, zéro
  abonnement). Parle *Créneau / Praticienne / Disponibilité / Réservation*.
  Glossaire : `reservation/CONTEXT.md` — Décisions : `reservation/docs/adr/`.

- **Boutique en ligne** — `boutique/`
  Vente de produits de soin du cuir chevelu, en ligne et en boutique physique,
  autour d'un produit héros de niche. Sur **Shopify** (plateforme, pas de code
  custom au lancement). Parle *Produit / Stock / Commande*.
  Glossaire : `boutique/CONTEXT.md` — Décisions : `boutique/docs/adr/`.

## Frontière

La vente en ligne **n'existe pas** dans le contexte Réservation : là-bas, la
recommandation de produit reste **consultative** (donnée en soin). Toute vente en
ligne vit dans le contexte Boutique. Ce n'est pas un reniement de la décision
« pas de vente en ligne » du site de réservation — c'est une **séparation de
contextes** (voir `boutique/docs/adr/0001`).

Le lien entre les deux est un **tunnel d'acquisition** (soin → recommandation →
achat en boutique), pas un couplage technique. Sa forme reste à définir.
