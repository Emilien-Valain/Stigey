# Moteur de réservation custom plutôt que cal.com / Planity

On construit la réservation en interne (Next.js) au lieu d'utiliser Planity ou
cal.com, pour trois raisons : (1) **zéro abonnement récurrent** pour la cliente —
Planity est payant, et les fonctions cal.com qui comptent (acompte, SMS) sont
derrière un plan payant ; (2) une **identité visuelle forte** est impossible à
obtenir avec les embeds tiers ; (3) l'**acompte devra pouvoir être ajouté
rapidement** (voir ADR-0002), ce que cal.com gratuit ne permet pas.

## Conséquences

- La **DB Stigey est l'unique source de vérité des disponibilités**. Le contrôle
  anti-sur-réservation est **atomique en base** (contrainte d'unicité /
  transaction sur `praticienne + créneau`). Une **intégration API Google Agenda**
  (agenda Stigey partagé), *si* elle est branchée un jour, ne serait qu'une
  **projection one-way** : elle ne déciderait jamais d'une disponibilité. C'est un
  **principe d'architecture**, pas un engagement de lancement — cette intégration
  est tenue en réserve (« option-3 »). À ne pas confondre avec l'**invitation
  `.ics`** envoyée par email, elle, présente au lancement (voir ADR-0004), qui
  peuple l'agenda de la praticienne et du client sans aucune API Google.
- Une réservation est **toujours rattachée à une praticienne** (une seule au
  lancement) pour ne pas fermer la porte au multi-praticienne plus tard.
- On perd l'**acquisition « place de marché »** qu'apporte Planity : la cliente
  doit disposer de son propre canal d'acquisition (Google Business, Instagram…).
- **Conflit de créneau au lancement : pas de verrou temporaire.** L'affichage des
  créneaux est optimiste, la réservation est **revendiquée atomiquement à la
  validation**. Si le créneau a été pris entre-temps, le client voit un **message
  explicite** (« ce créneau vient d'être réservé ») et les **créneaux frais**, sa
  prestation et ses coordonnées **préservées** — jamais une erreur opaque ni une
  re-saisie. Un verrou « pré-réservé + expiration » (type billetterie) est écarté
  comme sur-ingénierie au volume d'une praticienne solo ; il pourra être ajouté si
  des créneaux très demandés (rush Instagram) génèrent des collisions fréquentes.
- Le client **gère sa réservation sans compte**, via un **lien signé** (token)
  envoyé dans l'email de confirmation, vers une page « gérer ma réservation »
  (annuler / reporter). Cohérent avec les comptes clients tenus en réserve
  (ADR-0004). L'annulation **libère le créneau atomiquement** en base. La règle
  d'annulation 24 h (ADR-0002) est **câblée dans le self-service** : au-delà de
  24 h le client agit seul ; à moins de 24 h le self-service est bloqué et renvoie
  vers le canal direct (téléphone) — point d'ancrage de la future règle
  « annulation tardive = acompte perdu ».
