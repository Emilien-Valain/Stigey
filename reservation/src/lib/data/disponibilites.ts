import { createClient } from "@/lib/supabase/server";

export type DispoRecurrente = {
  jourSemaine: number; // 0=dimanche … 6=samedi (Date.getDay())
  ouvert: boolean;
  heureDebut: string;
  heureFin: string;
};

export async function getDisponibilites(): Promise<DispoRecurrente[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("disponibilites_recurrentes")
    .select("jour_semaine, ouvert, heure_debut, heure_fin")
    .order("jour_semaine", { ascending: true });

  if (error) throw error;
  return data.map((d) => ({
    jourSemaine: d.jour_semaine,
    ouvert: d.ouvert,
    heureDebut: d.heure_debut,
    heureFin: d.heure_fin,
  }));
}
