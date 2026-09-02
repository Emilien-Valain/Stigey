import { createClient } from "@/lib/supabase/server";

export type Indisponibilite = {
  id: string;
  dateDebut: string;
  dateFin: string;
  heureDebut: string | null;
  heureFin: string | null;
};

export async function getIndisponibilites(): Promise<Indisponibilite[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("indisponibilites")
    .select("id, date_debut, date_fin, heure_debut, heure_fin")
    .order("date_debut", { ascending: true });

  if (error) throw error;
  return data.map((i) => ({
    id: i.id,
    dateDebut: i.date_debut,
    dateFin: i.date_fin,
    heureDebut: i.heure_debut,
    heureFin: i.heure_fin,
  }));
}
