# Stigey

Stigey est un head spa à dimension clinique : soins et massages du cuir chevelu,
moments de relaxation, et recommandations de produits personnalisées pour des
personnes ayant des problématiques de cuir chevelu. Dans **ce** contexte
(Réservation), la vente de produits est consultative (recommandation en soin), pas
en ligne. La vente en ligne existe, mais dans un **projet séparé** — la Boutique
(voir `../CONTEXT-MAP.md`).

## Language

**Prestation**:
Un soin réservable, défini par une durée et un prix (ex. « Diagnostic », 1h, 40 €).
Le catalogue compte 3 à 4 prestations.
_Avoid_: Service, offre, produit

**Réservation**:
L'acte par lequel un client bloque un créneau horaire pour une prestation donnée.
Confirmée dès sa création (pas d'état « en attente » : aucun paiement en ligne).
Ses états : **Confirmée** → **Annulée**, ou (après le créneau) **Honorée** /
**No-show**.
_Avoid_: Rendez-vous, booking, RDV

**Honorée**:
État d'une Réservation dont le client s'est présenté. Marquée par la praticienne
après le créneau.
_Avoid_: Venue, présente, faite

**No-show**:
État d'une Réservation dont le client ne s'est pas présenté. Marquée par la
praticienne après le créneau. Tracée **dès le lancement** : c'est la donnée qui
prouvera (ou non) le coût des no-shows et déclenchera acompte/SMS (voir ADR-0002).
_Avoid_: Absence, lapin, oubli

**Diagnostic**:
Une prestation d'évaluation du cuir chevelu (exemple : 1h, 40 €).

**Praticienne**:
La personne qui réalise les soins. Une seule au lancement ; une réservation lui
est toujours rattachée pour permettre d'en ajouter d'autres plus tard.
_Avoid_: Coiffeuse, esthéticienne, employée

**Créneau**:
Une plage horaire réservable pour une prestation. **Résultat calculé à la volée**
(non stocké) : Disponibilité récurrente − Indisponibilités − Réservations
existantes, en ne gardant que les plages où la durée de la prestation tient
(battement inclus). Voir ADR-0006.
_Avoid_: Slot, plage, horaire

**Battement**:
Temps tampon configurable après une Réservation (remise en état de la cabine,
accueil), intégré au calcul des Créneaux. Réglé par la praticienne dans l'admin ;
0 par défaut.
_Avoid_: Pause, marge, buffer, transition

**Disponibilité récurrente**:
Le motif d'ouverture régulier que pose la praticienne (ex. « tous les mardis et
jeudis, 9 h–18 h »). Source positive d'où sont engendrés les Créneaux.
_Avoid_: Horaires, planning, agenda

**Indisponibilité**:
Une exception datée qui retire des Créneaux par-dessus la Disponibilité récurrente.
Concept unique, quelle que soit l'intention : « bloquer une journée » est une
Indisponibilité d'un jour, « congés » une Indisponibilité de plusieurs jours.
« Congés » n'est qu'un libellé d'UI, pas une entité distincte.
_Avoid_: Congés (comme entité), blocage, absence, fermeture

**Acompte**:
Somme versée à l'avance lors de la réservation pour garantir la venue et limiter
les no-shows. Pas en place au lancement, mais le système doit pouvoir l'accueillir.
_Avoid_: Arrhes, dépôt, caution

**Annulation**:
Libération d'un créneau déjà réservé. Le créneau redevient disponible.
_Avoid_: Suppression, désistement

**Report**:
Déplacement d'une réservation vers un autre créneau : techniquement une
annulation suivie d'une nouvelle réservation, traitée de façon atomique.
_Avoid_: Modification, changement, déplacement

**Recommandation produit**:
Conseil personnalisé d'un produit adapté au cuir chevelu, donné en soin. N'est
pas une vente en ligne : la vente vit dans le contexte Boutique (`../CONTEXT-MAP.md`).
_Avoid_: Vente, commande

**Fiche client**:
Le dossier de suivi clinique d'un client (antécédents, problématiques de cuir
chevelu, soins passés, recommandations). Contient de la donnée de santé. **Tenue
en réserve** : n'existe pas au lancement. La Réservation, elle, ne collecte
jamais de donnée de santé (voir ADR « pas de donnée de santé en ligne »).
_Avoid_: Dossier médical, fiche de suivi, historique client
