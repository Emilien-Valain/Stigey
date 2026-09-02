"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function revalider() {
  revalidatePath("/admin/indisponibilites");
  revalidatePath("/reservation");
}

export type AjoutIndisponibiliteInput = {
  dateDebut: string;
  dateFin: string;
  heureDebut: string | null;
  heureFin: string | null;
};

export async function ajouterIndisponibilite(input: AjoutIndisponibiliteInput) {
  const supabase = await createClient();
  const { error } = await supabase.from("indisponibilites").insert({
    date_debut: input.dateDebut,
    date_fin: input.dateFin,
    heure_debut: input.heureDebut,
    heure_fin: input.heureFin,
  });

  if (error) throw error;
  revalider();
}

export async function supprimerIndisponibilite(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("indisponibilites").delete().eq("id", id);
  if (error) throw error;
  revalider();
}
