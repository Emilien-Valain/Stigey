"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type PrestationInput = {
  id?: string;
  nom: string;
  dureeMinutes: number;
  prixCentimes: number;
  accroche: string;
  description: string;
  cible: string;
};

function revalider() {
  revalidatePath("/admin/prestations");
  revalidatePath("/");
  revalidatePath("/prestations");
  revalidatePath("/reservation");
}

export async function enregistrerPrestation(input: PrestationInput) {
  const supabase = await createClient();
  const payload = {
    nom: input.nom,
    duree_minutes: input.dureeMinutes,
    prix_centimes: input.prixCentimes,
    accroche: input.accroche,
    description: input.description,
    cible: input.cible,
  };

  const { error } = input.id
    ? await supabase.from("prestations").update(payload).eq("id", input.id)
    : await supabase.from("prestations").insert(payload);

  if (error) throw error;
  revalider();
}

// Désactivation (pas de suppression en base) : la prestation disparaît du
// site public, les Réservations déjà prises la conservent (FK intacte).
export async function desactiverPrestation(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("prestations").update({ actif: false }).eq("id", id);
  if (error) throw error;
  revalider();
}
