# Pas d'acompte au lancement ; rappels email, SMS différé

Au lancement, **pas de paiement ni d'acompte en ligne** : le système reste
néanmoins « Stripe-ready » pour brancher l'acompte rapidement le jour où il est
justifié. Les **no-shows** sont mitigés par des **rappels email** (gratuits, via
un provider transactionnel). La couche de notification est **agnostique au
canal** (un `Notifier`), pour brancher le SMS sans rien réécrire.

Le **SMS est différé**, alors que c'est le meilleur levier anti-no-show (taux
d'ouverture ~98 %), parce qu'il a un **coût à l'usage** (~0,05–0,08 € / SMS, donc
de l'usage et non un abonnement) et qu'il n'est pas nécessaire tant que les
no-shows ne sont pas un coût prouvé.

## Timing du rappel

**Un rappel email unique à ~48 h avant le créneau**, calé **juste avant la
fermeture de la fenêtre d'annulation gratuite** (24 h). Le rappel fait alors un
double travail : nudge de présence **et** dernière occasion de **libérer le
créneau proprement** (CTA « empêchement ? annulez/reportez gratuitement jusqu'à
[24 h avant] »). Un rappel calé *à* 24 h serait trop tard pour une annulation
gratuite — le créneau ne serait pas recyclé.

Un **rappel le jour même** (pur anti-oubli, le vrai levier du jour J) est **prévu
mais en réserve** : il passera par la même couche `Notifier` agnostique au canal,
en **email d'abord** puis en **SMS** quand le SMS sera activé (voir déclencheur
ci-dessous). Gardé hors lancement pour rester simple.

## Déclencheur (quand activer SMS et/ou acompte)

Quand les no-shows deviennent un coût réel et récurrent. À ce moment : activer le
SMS de rappel (quelques heures de dev, provider type Twilio/Brevo) et/ou l'acompte
Stripe. La politique d'annulation 24 h est déjà posée pour accueillir la règle
« annulation tardive = acompte perdu ».

**Instrument du déclencheur (présent dès le lancement) :** une Réservation est
marquée **Honorée** ou **No-show** par la praticienne après le créneau. Ce suivi
transforme « les no-shows sont devenus un coût » d'une impression en un **chiffre**.
Sans cette donnée tracée dès le départ, le déclencheur resterait subjectif.

## Option écartée

cal.com Workflows (rappels email + SMS intégrés) : rejeté car le SMS y est gated
derrière un plan payant, et cal.com est déjà écarté par l'ADR-0001.
