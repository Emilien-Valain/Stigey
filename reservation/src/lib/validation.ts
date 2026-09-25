// Validation partagée entre le tunnel public et les Server Actions
// (défense en profondeur : revalidé côté serveur, jamais fait confiance au
// seul contrôle client). Regex volontairement simple — suffisant pour
// rejeter les fautes de frappe évidentes, pas une RFC 5322 complète.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function emailValide(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

// Résultat de validation : jamais d'exception pour une entrée client invalide,
// un message lisible par la praticienne à la place.
export type Validation<T> = { ok: true; valeur: T } | { ok: false; erreur: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ORDRE_MAX = 100;

export function uuidValide(valeur: unknown): valeur is string {
  return typeof valeur === "string" && UUID_RE.test(valeur);
}

// Nouvel ordre envoyé par le client (Server Action, donc joignable en POST
// direct) : uniquement des uuid distincts, en nombre borné.
export function validerOrdre(ids: unknown): Validation<string[]> {
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > ORDRE_MAX) {
    return { ok: false, erreur: "Ordre invalide." };
  }
  if (!ids.every(uuidValide) || new Set(ids).size !== ids.length) {
    return { ok: false, erreur: "Ordre invalide." };
  }
  return { ok: true, valeur: ids };
}

const NOM_CATEGORIE_MAX = 80;

export function validerCategorie(input: unknown): Validation<{ nom: string }> {
  const nom =
    typeof input === "object" && input !== null && "nom" in input && typeof input.nom === "string"
      ? input.nom.trim()
      : "";
  if (!nom) return { ok: false, erreur: "Le nom de la catégorie est nécessaire." };
  if (nom.length > NOM_CATEGORIE_MAX) {
    return { ok: false, erreur: `Le nom de la catégorie ne dépasse pas ${NOM_CATEGORIE_MAX} caractères.` };
  }
  return { ok: true, valeur: { nom } };
}

export type VarianteValidee = {
  id?: string;
  nom: string;
  dureeMinutes: number;
  prixCentimes: number;
};

export type PrestationValidee = {
  id?: string;
  nom: string;
  categorieId: string;
  // Prestation simple : durée et prix propres. Prestation à variantes : null
  // (ils viennent de la Variante choisie). Voir CONTEXT.md : Variante.
  dureeMinutes: number | null;
  prixCentimes: number | null;
  // Liste complète, dans l'ordre de la praticienne ; vide = Prestation simple.
  variantes: VarianteValidee[];
  accroche: string;
  description: string;
  cible: string;
  miseEnAvant: boolean;
  // Chemin sous /images/ ("" = aucune). L'existence du fichier est vérifiée
  // côté serveur (actions/prestations-admin.ts), pas ici : ce module reste pur.
  image: string;
};

export const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp)$/i;
const IMAGE_CHEMIN = /^\/images\/[\w.-]+$/;

const NOM_PRESTATION_MAX = 120;
const ACCROCHE_MAX = 300;
const DESCRIPTION_MAX = 2000;
const CIBLE_MAX = 500;
const DUREE_MAX_MINUTES = 600;
const PRIX_MAX_CENTIMES = 1_000_000;
const NOM_VARIANTE_MAX = 80;
const VARIANTES_MAX = 20;

function entierBorne(valeur: unknown, min: number, max: number): valeur is number {
  return typeof valeur === "number" && Number.isInteger(valeur) && valeur >= min && valeur <= max;
}

function validerVariantes(brut: unknown): Validation<VarianteValidee[]> {
  const invalide = (erreur: string): Validation<VarianteValidee[]> => ({ ok: false, erreur });
  if (brut === undefined) return { ok: true, valeur: [] };
  if (!Array.isArray(brut) || brut.length > VARIANTES_MAX) return invalide("Variantes invalides.");
  // Une seule Variante n'a pas de sens : ce serait une Prestation simple.
  if (brut.length === 1) return invalide("Ajoutez au moins deux variantes, ou aucune.");

  const variantes: VarianteValidee[] = [];
  for (const entree of brut) {
    if (typeof entree !== "object" || entree === null) return invalide("Variantes invalides.");
    const v = entree as Record<string, unknown>;
    const nom = typeof v.nom === "string" ? v.nom.trim() : "";
    if (!nom || nom.length > NOM_VARIANTE_MAX) {
      return invalide(`Chaque variante a un nom (${NOM_VARIANTE_MAX} caractères max).`);
    }
    if (v.id !== undefined && !uuidValide(v.id)) return invalide("Variantes invalides.");
    if (!entierBorne(v.dureeMinutes, 1, DUREE_MAX_MINUTES)) {
      return invalide(`Durée invalide pour la variante « ${nom} ».`);
    }
    if (!entierBorne(v.prixCentimes, 0, PRIX_MAX_CENTIMES)) {
      return invalide(`Prix invalide pour la variante « ${nom} ».`);
    }
    variantes.push({
      ...(v.id !== undefined ? { id: v.id as string } : {}),
      nom,
      dureeMinutes: v.dureeMinutes,
      prixCentimes: v.prixCentimes,
    });
  }
  const ids = variantes.flatMap((v) => (v.id ? [v.id] : []));
  if (new Set(ids).size !== ids.length) return invalide("Variantes invalides.");
  return { ok: true, valeur: variantes };
}

export function validerPrestation(input: unknown): Validation<PrestationValidee> {
  const invalide = (erreur: string): Validation<PrestationValidee> => ({ ok: false, erreur });
  if (typeof input !== "object" || input === null) return invalide("Prestation invalide.");
  const p = input as Record<string, unknown>;

  const nom = typeof p.nom === "string" ? p.nom.trim() : "";
  if (!nom || nom.length > NOM_PRESTATION_MAX) return invalide("Le nom est nécessaire (120 caractères max).");
  if (!uuidValide(p.categorieId)) return invalide("Choisissez une catégorie.");
  if (p.id !== undefined && !uuidValide(p.id)) return invalide("Prestation invalide.");
  const variantes = validerVariantes(p.variantes);
  if (!variantes.ok) return invalide(variantes.erreur);
  // Avec des variantes, la durée et le prix de la Prestation sont ignorés.
  const simple = variantes.valeur.length === 0;
  if (simple && !entierBorne(p.dureeMinutes, 1, DUREE_MAX_MINUTES)) return invalide("Durée invalide.");
  if (simple && !entierBorne(p.prixCentimes, 0, PRIX_MAX_CENTIMES)) return invalide("Prix invalide.");
  if (typeof p.miseEnAvant !== "boolean") return invalide("Prestation invalide.");
  const image = p.image ?? "";
  if (
    typeof image !== "string" ||
    (image !== "" && !(IMAGE_CHEMIN.test(image) && IMAGE_EXTENSIONS.test(image) && !image.includes("..")))
  ) {
    return invalide("Image invalide.");
  }

  const textes = [
    [p.accroche, ACCROCHE_MAX, "L'accroche"],
    [p.description, DESCRIPTION_MAX, "La description"],
    [p.cible, CIBLE_MAX, "Le public visé"],
  ] as const;
  for (const [texte, max, libelle] of textes) {
    if (typeof texte !== "string" || texte.length > max) {
      return invalide(`${libelle} ne dépasse pas ${max} caractères.`);
    }
  }

  return {
    ok: true,
    valeur: {
      ...(p.id !== undefined ? { id: p.id as string } : {}),
      nom,
      categorieId: p.categorieId,
      dureeMinutes: simple ? (p.dureeMinutes as number) : null,
      prixCentimes: simple ? (p.prixCentimes as number) : null,
      variantes: variantes.valeur,
      accroche: p.accroche as string,
      description: p.description as string,
      cible: p.cible as string,
      miseEnAvant: p.miseEnAvant,
      image,
    },
  };
}
