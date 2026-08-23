# Boutique en ligne

La Boutique vend des **produits de soin du cuir chevelu**, en ligne et en boutique
physique, autour d'un **produit héros** de niche que la praticienne a sourcé. C'est
un projet **distinct du moteur de réservation** (voir `../CONTEXT-MAP.md`), monté
sur **Shopify**. Au lancement : vente du produit héros **en stock**. Le
**dropshipping** est une phase 2 tenue en réserve.

## Language

**Produit**:
Un article physique vendu par la Boutique. Concept de **première classe** ici —
alors qu'il est proscrit (`_Avoid_`) dans le contexte Réservation, où « produit »
ne désigne jamais un soin. C'est une illustration de la frontière entre contextes.
_Avoid_: Article (comme synonyme flou), prestation, soin

**Produit héros**:
Le produit de niche spécifique que la praticienne a trouvé pour sa clientèle, cœur
du business et raison d'être de la Boutique. **Détenu en stock** et **déjà vendu en
boutique physique** — sa demande est donc validée hors ligne. C'est lui, et lui
seul, qui justifie le lancement de la Boutique.
_Avoid_: Produit phare, best-seller, tête de gondole

**Stock**:
L'inventaire des produits détenus par la praticienne. **Source de vérité unique =
Shopify**, synchronisé entre la vente en ligne et la boutique physique (POS). Un
produit vendu en cabine décrémente le même stock qu'une vente en ligne.
_Avoid_: Inventaire (comme entité distincte), réserve

**Boutique physique**:
Le lieu où la praticienne vend les produits en personne. Partage son Stock avec la
Boutique en ligne via le POS Shopify.
_Avoid_: Magasin, point de vente, cabine

**Dropshipping**:
Vente de produits **expédiés directement par un fournisseur**, sans stock détenu.
**En réserve — phase 2**, hors périmètre de lancement. Y logent l'essentiel du
risque : responsabilité légale de vendeur (droit de rétractation, conformité),
marges minces, délais de livraison longs. Sera branché (type DSers) seulement une
fois la Boutique validée par le produit héros.
_Avoid_: Marque blanche, vente sans stock
