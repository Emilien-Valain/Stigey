# Boutique en ligne sur Shopify, contexte séparé du moteur de réservation

La cliente veut vendre des produits en ligne, autour d'un **produit héros** de
niche qu'elle a sourcé et vend déjà en **boutique physique**. On monte cette vente
comme un **projet distinct sur Shopify**, et **non** comme un module du site de
réservation. Au lancement : le(s) produit(s) héros **en stock**. Le **dropshipping**
est différé en phase 2.

## Pourquoi séparé, et pas dans le site de réservation

Réservation et commerce sont deux **bounded contexts** différents : l'un parle
Créneau / Praticienne / Disponibilité, l'autre Produit / Stock / Commande /
Expédition / Retour. Les fusionner ferait **exploser le scope et le budget** de la
cliente **et** salirait le modèle propre du moteur de réservation. La frontière est
nette (voir `../../CONTEXT-MAP.md`) : la vente en ligne n'existe pas côté
Réservation, où la recommandation de produit reste **consultative**. Ce n'est donc
pas un reniement de la décision « pas de vente en ligne » du site de réservation,
mais une séparation de contextes.

## Pourquoi Shopify, malgré le principe « zéro abonnement »

Le principe « zéro abonnement récurrent » (ADR-0001/0004 du contexte Réservation)
visait un **outil de booking** pour une praticienne solo, où des alternatives
gratuites existent. Un abonnement Shopify n'est pas de même nature : c'est un
**coût d'exploitation d'une boutique qui génère du revenu**, pas une rente sur un
outil. Le principe ne se transfère donc pas mécaniquement.

Trois raisons concrètes :

1. **Construire l'e-commerce en custom exploserait le scope** : paiement, panier,
   TVA sur biens, stock, frais de port, retours, gestion de commandes — sans parler
   de la **synchro stock boutique physique ↔ en ligne** (POS), que Shopify fait
   nativement et qu'on ne veut surtout pas coder.
2. **Une page custom de test ne teste que la demande, pas l'opération.** Un Stripe
   Checkout à 0 € validerait « quelqu'un clique acheter », mais **ni le stock, ni le
   POS, ni le dropshipping** — c'est-à-dire l'inconnue réelle. Shopify teste le
   système entier, ops comprise.
3. **Pas de reconstruction si ça marche.** Une page custom jetable imposerait de
   tout rebâtir en cas de succès. Shopify évite le « construire deux fois » : le
   dropshipping se branchera plus tard (type DSers) sans changer de socle.

## Pourquoi le produit héros en stock au lancement, dropshipping en phase 2

On applique le pattern « en réserve jusqu'à preuve » déjà tenu sur tout le projet
(acompte, SMS, comptes clients). Le **produit héros stocké** = risque quasi nul,
marge connue, **demande déjà validée en boutique physique** → il justifie à lui
seul Shopify. Le **dropshipping** concentre le risque (responsabilité légale de
vendeur — rétractation 14 j, conformité — marges minces, délais longs) et attendra
que le héros ait prouvé la Boutique.

## Conséquences

- **Nouvel abonnement récurrent** assumé : ~30 €/mois **plancher**, davantage avec
  les apps (synchro fournisseur, TVA/OSS, POS Pro). Justifié par le revenu ;
  à réévaluer si le produit héros ne valide pas la Boutique sous ~2 mois.
- **Nouvelle surface légale** absente du site de réservation : TVA sur biens,
  seuils OSS si vente hors France, **CGV**, **droit de rétractation 14 j**,
  facturation. À traiter avant d'ouvrir la vente.
- **Deux marques/sites** à garder cohérents. Le **tunnel soin → recommandation →
  achat** reste à concevoir (lien d'acquisition, pas couplage technique).
- Le glossaire du contexte Réservation **ne change pas** : la recommandation de
  produit y reste consultative.

## Alternatives écartées

- **Intégrer au site de réservation** : explose scope/budget, mélange deux
  bounded contexts.
- **Page custom Stripe Checkout** : valide la demande mais pas l'opération
  (stock/POS), et impose de reconstruire en cas de succès.
