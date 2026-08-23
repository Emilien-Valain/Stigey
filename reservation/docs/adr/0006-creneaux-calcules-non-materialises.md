# Créneaux calculés à la volée, non matérialisés

La durée d'un Créneau **dépend de la Prestation** choisie (un Diagnostic ~1 h, un
soin complet ~1 h 30). « Mardi 10 h est-il libre ? » n'a donc pas de sens dans
l'absolu : la réponse dépend de ce qu'on réserve.

**Décision : le Créneau n'est pas une entité pré-matérialisée en base. C'est un
résultat calculé à la volée**, une fois la Prestation (donc sa durée) connue. Le
tunnel impose l'ordre **Prestation → Créneau → coordonnées → confirmation**.

Ce qui est **stocké en dur** : les **Disponibilités récurrentes**, les
**Indisponibilités** et les **Réservations**. Les débuts de créneaux proposés se
calculent ainsi :

> Disponibilité récurrente − Indisponibilités − Réservations existantes,
> en ne gardant que les plages où la **durée de la prestation tient**
> (battement inclus).

## Battement configurable

Un **battement** (temps tampon après un soin : remise en état de la cabine,
accueil) est **configurable dans l'admin** par la praticienne. Valeur par défaut
**0** ; l'option existe pour son confort, sans l'imposer. Le calcul des créneaux
intègre ce battement après chaque Réservation.

## Conséquences

- L'**unicité atomique** anti-sur-réservation (ADR-0001) porte sur la Réservation
  écrite, pas sur un slot pré-réservé : deux réservations ne peuvent pas se
  chevaucher pour une même praticienne.
- Changer une Disponibilité, une Indisponibilité ou le battement **recompose
  immédiatement** l'offre de créneaux, sans migration de slots matérialisés.
- Le coût est calculatoire (recalcul à chaque affichage), négligeable au volume
  d'une praticienne solo.

## Option écartée

**Grille fixe** (journée pré-découpée à pas constant, ex. toutes les heures,
indépendamment de la prestation) : plus simple, mais fausse dès qu'une prestation
ne tombe pas pile sur le pas (1 h 30, 45 min) — gaspillage de temps ou débordement
sur le créneau suivant. Rejetée car le catalogue compte des prestations de durées
différentes.
