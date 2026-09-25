import { createClient } from "@/lib/supabase/server";
import { dureeLabel, prixLabel } from "@/lib/format";
import { resumeTarifs } from "@/lib/catalogue";

// Source unique pour Accueil, Prestations et le tunnel de Réservation
// (remplace l'ancien export statique de lib/prestations.ts).
// Voir CONTEXT.md : Variante. Choix obligatoire quand la Prestation en a.
export type Variante = {
  id: string;
  nom: string;
  duree: string;
  dureeMinutes: number;
  prix: string;
  prixCentimes: number;
};

export type Prestation = {
  id: string;
  nom: string;
  // Libellés de carte, toujours renseignés : « 1 h » / « 60 € » pour une
  // Prestation simple, « 1 h – 1 h 30 » / « à partir de 40 € » avec Variantes.
  duree: string;
  prix: string;
  // Tarif propre : null quand la Prestation a des Variantes (ce sont elles qui
  // portent durée et prix).
  dureeMinutes: number | null;
  prixCentimes: number | null;
  variantes: Variante[];
  accroche: string;
  description: string;
  descriptionMobile?: string;
  cible: string;
  categorieId: string;
  miseEnAvant: boolean;
  image: string;
};

export type Categorie = {
  id: string;
  nom: string;
};

type VarianteRow = {
  id: string;
  nom: string;
  duree_minutes: number;
  prix_centimes: number;
};

type Row = {
  id: string;
  nom: string;
  duree_minutes: number | null;
  prix_centimes: number | null;
  variantes_prestations: VarianteRow[];
  accroche: string;
  description: string;
  description_mobile: string | null;
  cible: string;
  categorie_id: string;
  mise_en_avant: boolean;
  image_url: string;
};

const COLONNES =
  "id, nom, duree_minutes, prix_centimes, accroche, description, description_mobile, cible, categorie_id, mise_en_avant, image_url, variantes_prestations(id, nom, duree_minutes, prix_centimes)";

function toVariante(row: VarianteRow): Variante {
  return {
    id: row.id,
    nom: row.nom,
    duree: dureeLabel(row.duree_minutes),
    dureeMinutes: row.duree_minutes,
    prix: prixLabel(row.prix_centimes),
    prixCentimes: row.prix_centimes,
  };
}

function toPrestation(row: Row): Prestation {
  const variantes = row.variantes_prestations.map(toVariante);
  const prestation = {
    dureeMinutes: row.duree_minutes,
    prixCentimes: row.prix_centimes,
    variantes,
  };
  const { duree, prix } = resumeTarifs(prestation, dureeLabel, prixLabel);
  return {
    id: row.id,
    nom: row.nom,
    duree,
    prix,
    ...prestation,
    accroche: row.accroche,
    description: row.description,
    descriptionMobile: row.description_mobile ?? undefined,
    cible: row.cible,
    categorieId: row.categorie_id,
    miseEnAvant: row.mise_en_avant,
    image: row.image_url,
  };
}

export async function getPrestations(): Promise<Prestation[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prestations")
    .select(COLONNES)
    .eq("actif", true)
    .eq("variantes_prestations.actif", true)
    .order("ordre", { ascending: true })
    .order("ordre", { ascending: true, referencedTable: "variantes_prestations" });

  if (error) throw error;
  return (data as unknown as Row[]).map(toPrestation);
}

export async function getPrestation(id: string): Promise<Prestation | undefined> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prestations")
    .select(COLONNES)
    .eq("id", id)
    .eq("actif", true)
    .eq("variantes_prestations.actif", true)
    .order("ordre", { ascending: true, referencedTable: "variantes_prestations" })
    .maybeSingle();

  if (error) throw error;
  return data ? toPrestation(data as unknown as Row) : undefined;
}

// Ordre de la praticienne : l'ordre des catégories, puis celui des soins dans
// chaque catégorie. Tous les lecteurs (site, tunnel, admin) le respectent.
export async function getCategories(): Promise<Categorie[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories_prestations")
    .select("id, nom")
    .eq("actif", true)
    .order("ordre", { ascending: true });

  if (error) throw error;
  return data as Categorie[];
}
