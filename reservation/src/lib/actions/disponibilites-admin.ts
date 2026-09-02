"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { DispoRecurrente } from "@/lib/data/disponibilites";

export async function enregistrerSemaineType(dispos: DispoRecurrente[]) {
  const supabase = await createClient();
  const { error } = await supabase.from("disponibilites_recurrentes").upsert(
    dispos.map((d) => ({
      jour_semaine: d.jourSemaine,
      ouvert: d.ouvert,
      heure_debut: d.heureDebut,
      heure_fin: d.heureFin,
    })),
  );

  if (error) throw error;
  revalidatePath("/admin/disponibilites");
  revalidatePath("/reservation");
}
