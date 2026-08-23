# Pas de donnée de santé en ligne au lancement (privacy by design)

Stigey est un head spa **à dimension clinique** : il s'adresse à des personnes
ayant des problématiques de cuir chevelu (psoriasis, dermite, chute…). Une telle
problématique est une **donnée de santé au sens de l'article 9 RGPD** (catégorie
particulière, régime le plus strict : consentement explicite, mesures de sécurité
renforcées, base légale dédiée).

**Décision : au lancement, aucune donnée de santé n'entre dans le système.** La
Réservation ne collecte que de l'**identité et du contact** (nom, email,
téléphone), la **prestation** et le **créneau**. Tout échange clinique
(diagnostic, antécédents, contre-indications) se fait **en cabine ou par un canal
direct hors Stigey** (téléphone), jamais saisi en ligne.

C'est un choix de **privacy by design** : on *évite* le régime article-9 au lieu
de le *gérer*. Pas de donnée de santé en base = pas de consentement explicite à
bâtir, pas de surface de risque article-9 sur une infra free tier dont une partie
des sous-traitants est hors-UE (voir ADR-0004). Tant que la **Fiche client**
(suivi clinique) reste en réserve, rien ne justifie d'aspirer de la donnée de
santé en ligne.

## Conséquence directe : le formulaire de réservation n'a aucun champ libre

Le vecteur de fuite classique est la zone « message à la praticienne » : un client
y écrit spontanément « j'ai du psoriasis et je prends tel traitement », et de la
donnée article-9 se retrouve stockée sans consentement. Donc **aucun champ libre**
dans le formulaire au lancement. Un client qui a besoin d'échanger avant le RDV
(allergie, grossesse, contre-indication) est redirigé vers un **canal direct**
(téléphone).

Le formulaire doit toutefois être **conçu pour accueillir** un futur champ
« message » optionnel **avec garde-fou** (mention « ne renseignez aucune
information de santé ici ») si le besoin émerge — sans refonte.

## Options écartées

- **Champ libre assumé comme donnée de santé** : garder une zone message et
  traiter toute la base réservation comme potentiellement article-9. Rejeté : fait
  retomber dans le régime de consentement explicite, exactement ce qu'on veut
  éviter au lancement.
- **Questionnaire d'intake clinique en ligne** (antécédents, traitements,
  allergies saisis avant le RDV) : pratique pour préparer le soin, mais c'est de
  la donnée de santé structurée. Reporté avec la Fiche client, qui rouvrira son
  propre ADR (consentement explicite, base légale, conservation, sécurité).

## Déclencheur de réouverture

Le jour où la **Fiche client** sort de réserve (suivi clinique, fidélité,
historique). À ce moment : ADR dédié couvrant le consentement explicite, la base
légale article-9, la durée de conservation, le chiffrement et les droits des
personnes.
