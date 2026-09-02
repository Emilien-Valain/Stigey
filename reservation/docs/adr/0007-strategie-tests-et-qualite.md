# Stratégie de tests et de qualité : gardes-fous ciblés, pas de couverture générale

Le code actuel (`ReservationFlow.tsx`, `demo-creneaux.ts`) est une **démo front
sans backend branché** : aucune donnée n'est persistée, les créneaux sont
générés en mémoire. Écrire des tests contre ce code jetable n'a pas de valeur —
il sera remplacé dès que Supabase sera branché (voir ADR-0004, ADR-0006).

**Décision : les tests s'écrivent en même temps que chaque fonctionnalité, pas
en bloc a posteriori ni par anticipation sur du code qui n'existe pas encore.**
Deux zones reçoivent un traitement renforcé car ce sont les deux endroits que
les ADR précédents identifient eux-mêmes comme *cassables silencieusement* :

1. **Unicité atomique anti-sur-réservation** (ADR-0001) : deux réservations ne
   doivent jamais se chevaucher pour une même praticienne.
2. **Cycle `.ics`** (ADR-0004) : l'invitation calendrier (`UID` stable,
   `SEQUENCE` incrémenté, `method=REQUEST`) doit rester une invitation qui se
   met à jour toute seule, jamais une pièce jointe inerte.

Pour ces deux zones : **TDD strict** (test écrit avant le code) et test
**d'intégration contre une vraie base Postgres de test**, jamais de mock de la
DB — un mock aurait laissé passer une regression sur une contrainte
d'exclusion Postgres, exactement le genre de bug que ADR-0001 redoute. Pour le
reste du code applicatif (UI, logique simple) : règle plus légère, « jamais
committé sans son test », sans exiger l'ordre test-avant-code.

## Outillage

- **Vitest** pour l'unitaire et l'intégration (proche de l'écosystème
  Next/Vite, plus rapide que Jest).
- **Playwright** pour l'E2E. Un premier test couvre déjà la navigation du
  tunnel de réservation (`ReservationFlow.tsx`) : cette navigation est
  durable, seule la source des créneaux est fake et deviendra asynchrone
  quand Supabase sera branché.
- **Supabase CLI en local** (`supabase start`, stack Postgres via Docker) pour
  la DB de test des deux zones à risque, plutôt qu'un Postgres nu ou un second
  projet Supabase cloud : c'est la seule option qui garantit que les
  extensions et contraintes (ex. exclusion constraint `btree_gist` pour
  l'unicité atomique) se comportent comme en prod, tout en restant gratuite et
  utilisable hors-ligne.
- **Semgrep** en hook, avec les rulesets communautaires par défaut
  (`p/javascript`, `p/react`, `p/secrets`) **plus une règle custom** qui
  détecte un envoi d'`.ics` en pièce jointe au lieu d'une invitation
  `text/calendar; method=REQUEST` — le piège documenté dans ADR-0004.

## Répartition des hooks Git (pas de CI)

Le projet est solo, push direct sur `main`, sans flux de PR. Un flux
PR + CI GitHub Actions ajouterait de la friction sans bénéfice ici : les
**hooks Git locaux** suffisent.

- **pre-commit** (doit rester rapide, secondes) : lint + typecheck + Semgrep
  sur les fichiers stagés.
- **pre-push** (peut être plus lent, moins fréquent) : suite Vitest complète
  (unitaire + intégration DB) et suite Playwright (E2E).

## Options écartées

- **Écrire des tests dès maintenant contre `demo-creneaux.ts`** : rejeté, ce
  code sera jeté à l'arrivée du backend réel.
- **CI GitHub Actions / flux PR** : rejeté pour l'instant — solo-dev, Vercel
  fait déjà un build-check à chaque push, la friction d'un flux PR ne se
  justifie pas tant que le projet reste à une seule personne.
- **TDD strict partout** : rejeté hors des deux zones à risque — coût élevé
  pour un bénéfice faible sur de la logique UI simple.
- **E2E ou tests d'intégration en pre-commit** : rejeté, trop lent pour un hook
  qui tourne à chaque commit ; risque de décourager les commits fréquents.

## Déclencheur de réouverture

Si le projet passe à plusieurs contributeurs, ou si `boutique/` reçoit du code :
réévaluer le passage à un flux PR + CI, et étendre le périmètre de cette
stratégie au-delà de `reservation/`.
