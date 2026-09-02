import { createClient } from "@/lib/supabase/server";
import { dureeLabel } from "@/lib/format";

export type Statut = "confirmee" | "annulee" | "honoree" | "no_show";

export type ReservationAvecPrestation = {
  id: string;
  jour: string;
  heureDebut: string;
  heureFin: string;
  nom: string;
  email: string;
  telephone: string | null;
  statut: Statut;
  prestationNom: string;
  dureeLabel: string;
};

type Row = {
  id: string;
  jour: string;
  heure_debut: string;
  heure_fin: string;
  nom: string;
  email: string;
  telephone: string | null;
  statut: Statut;
  prestations: { nom: string; duree_minutes: number } | null;
};

const SELECT =
  "id, jour, heure_debut, heure_fin, nom, email, telephone, statut, prestations(nom, duree_minutes)";

function toReservation(row: Row): ReservationAvecPrestation {
  return {
    id: row.id,
    jour: row.jour,
    heureDebut: row.heure_debut,
    heureFin: row.heure_fin,
    nom: row.nom,
    email: row.email,
    telephone: row.telephone,
    statut: row.statut,
    prestationNom: row.prestations?.nom ?? "",
    dureeLabel: row.prestations ? dureeLabel(row.prestations.duree_minutes) : "",
  };
}

function aujourdhui(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getReservationsDuJour(): Promise<ReservationAvecPrestation[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reservations")
    .select(SELECT)
    .eq("jour", aujourdhui())
    .neq("statut", "annulee")
    .order("heure_debut", { ascending: true });

  if (error) throw error;
  return (data as unknown as Row[]).map(toReservation);
}

export async function getReservationsAvenir(): Promise<ReservationAvecPrestation[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reservations")
    .select(SELECT)
    .gte("jour", aujourdhui())
    .order("jour", { ascending: true })
    .order("heure_debut", { ascending: true });

  if (error) throw error;
  return (data as unknown as Row[]).map(toReservation);
}

export async function getReservationsHistorique(): Promise<ReservationAvecPrestation[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reservations")
    .select(SELECT)
    .lt("jour", aujourdhui())
    .order("jour", { ascending: false })
    .order("heure_debut", { ascending: false });

  if (error) throw error;
  return (data as unknown as Row[]).map(toReservation);
}

export async function getReservation(
  id: string,
): Promise<ReservationAvecPrestation | undefined> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reservations")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data ? toReservation(data as unknown as Row) : undefined;
}
