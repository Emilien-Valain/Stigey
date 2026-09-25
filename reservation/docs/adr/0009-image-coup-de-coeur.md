# Image des Coups de cœur

Seules les Prestations **mises en avant** (« Coup de cœur », ADR-0008) affichent une
image sur `/prestations`. Avec une dizaine de soins, une photo sur chaque carte
alourdit la page (surtout sur mobile) et exige des visuels homogènes ; l'image devient
un signal de hiérarchie, pas une obligation par soin.

## Décisions

- **Affichage = `miseEnAvant && image_url`**. Décocher « Coup de cœur » **conserve**
  `image_url` (rien n'est perdu si la praticienne le recoche) ; c'est le rendu qui
  décide. L'image est **facultative** : un Coup de cœur sans image reste une carte rose
  avec son badge.
- **Choix parmi les fichiers de `public/images/`**, pas d'upload (pas de Supabase
  Storage, ADR-0004). Ajouter une image = la committer dans ce dossier (GitHub suffit).
  Le sélecteur de l'admin liste le dossier au rendu (`lib/images-prestations.ts`) ; les
  logos y figurent aussi, assumé (peu de risque d'erreur, un seul dossier à connaître).
- **Validation en deux temps** : le format (`/images/<nom>.jpg|jpeg|png|webp`, sans
  sous-dossier ni `..`, `validerPrestation`) puis l'existence du fichier (action
  serveur). Un POST direct ne peut donc enregistrer ni URL externe ni chemin arbitraire.

## Mise en page

Essai 1 (bandeau photo de 132/170 px en haut de la carte, badge « Coup de cœur » dans le
flux) : abandonné, il décalait le titre de la carte par rapport à ses voisines. Retenu :
la Prestation Coup de cœur **avec image** occupe **2 colonnes** (photo à gauche, texte à
droite) ; la pastille « Coup de cœur » est **hors flux** (`absolute`), pour ne jamais
ajouter de hauteur avant le titre. Sur mobile, la photo reste en haut de la carte.
Retour arrière : retirer `sm:col-span-2 md:flex-row` et remettre une hauteur fixe à la
photo dans `app/(site)/prestations/page.tsx` ; ni la base ni l'admin ne changent.
