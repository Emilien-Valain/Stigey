# Stack et hébergement : tout en free tier

La stack est **Next.js + Tailwind**, hébergée sur **Vercel** (free tier),
avec **Postgres sur Supabase** (free tier) comme base de données et **Resend**
(free tier) pour l'email transactionnel (confirmations, rappels, invitations
`.ics`). Objectif central : **zéro abonnement récurrent** pour la cliente,
contrairement à Planity.

Supabase est préféré à Neon pour garder ouverte, sans changer d'infra, l'option
« comptes clients » mise en réserve (auth + storage intégrés).

L'`.ics` est envoyé comme une **invitation** (MIME `text/calendar; method=REQUEST`,
avec `ORGANIZER` / `ATTENDEE`), **pas comme une pièce jointe** inerte. C'est cette
distinction qui fait que l'évènement **s'ajoute, se déplace et se supprime tout
seul** dans l'agenda de la praticienne (organisateur) et du client (invité) —
comme une invitation de réunion — sans clic sur un fichier. La propagation
annulation/report repose sur un **UID stable + `SEQUENCE` incrémenté** (`CANCEL`
pour une Annulation, REQUEST mis à jour pour un Report). Un dev qui se contenterait
de joindre un fichier `.ics` casserait silencieusement cet automatisme.

## Arbitrage assumé : coût ↔ responsabilité

« Zéro abonnement » repose sur des **free tiers** dont la politique peut évoluer,
et signifie qu'il n'y a **pas de prestataire payant** qui assure la maintenance
(à la différence de Planity). La **maintenance est assurée par le développeur
(Emilien) au besoin**. Cet arbitrage — économiser l'abonnement contre porter la
responsabilité de la maintenance — est accepté en connaissance de cause.

Seul coût variable possible à terme : les **SMS** (voir ADR-0002), qui restent de
l'usage et non un abonnement.

## Résidence des données : UE (Frankfurt), fixée à la création

Le projet **Supabase est créé en région `eu-central-1` (Frankfurt)** et la donnée
personnelle (nom, email, téléphone — jamais de donnée de santé, voir ADR-0005)
réside donc dans l'UE. Coût nul (free tier identique), et la politique de
confidentialité devient un simple « hébergé dans l'UE » au lieu d'un dossier
« transferts internationaux ». **Attention : la région Supabase ne se change pas
après création** — il faut recréer le projet et migrer. À poser donc dès le départ.

Sous-traitant à signaler malgré tout : **Resend** (société US) fait transiter
nom + email à l'envoi des emails transactionnels. Assumé au lancement (volume
faible, pas de donnée de santé), mentionné dans la politique de confidentialité.
