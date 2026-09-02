import { createClient } from "@/lib/supabase/server";
import { dureeLabel, prixLabel } from "@/lib/format";

// Source unique pour Accueil, Prestations et le tunnel de Réservation
// (remplace l'ancien export statique de lib/prestations.ts).
export type Prestation = {
  id: string;
  nom: string;
  duree: string;
  dureeMinutes: number;
  prix: string;
  prixCentimes: number;
  accroche: string;
  description: string;
  descriptionMobile?: string;
  cible: string;
  badge?: string;
  image: string;
};

type Row = {
  id: string;
  nom: string;
  duree_minutes: number;
  prix_centimes: number;
  accroche: string;
  description: string;
  description_mobile: string | null;
  cible: string;
  badge: string | null;
  image_url: string;
};

function toPrestation(row: Row): Prestation {
  return {
    id: row.id,
    nom: row.nom,
    duree: dureeLabel(row.duree_minutes),
    dureeMinutes: row.duree_minutes,
    prix: prixLabel(row.prix_centimes),
    prixCentimes: row.prix_centimes,
    accroche: row.accroche,
    description: row.description,
    descriptionMobile: row.description_mobile ?? undefined,
    cible: row.cible,
    badge: row.badge ?? undefined,
    image: row.image_url,
  };
}

export async function getPrestations(): Promise<Prestation[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prestations")
    .select(
      "id, nom, duree_minutes, prix_centimes, accroche, description, description_mobile, cible, badge, image_url",
    )
    .eq("actif", true)
    .order("ordre", { ascending: true });

  if (error) throw error;
  return (data as Row[]).map(toPrestation);
}

export async function getPrestation(id: string): Promise<Prestation | undefined> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prestations")
    .select(
      "id, nom, duree_minutes, prix_centimes, accroche, description, description_mobile, cible, badge, image_url",
    )
    .eq("id", id)
    .eq("actif", true)
    .maybeSingle();

  if (error) throw error;
  return data ? toPrestation(data as Row) : undefined;
}
