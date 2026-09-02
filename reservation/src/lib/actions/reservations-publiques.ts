"use server";

import { createClient } from "@/lib/supabase/server";
import { calculerCreneaux, type Slot } from "@/lib/creneaux";

function jourSemaineDe(jour: string): number {
  const [y, m, d] = jour.split("-").map(Number);
  return new Date(y, m - 1, d).getDay();
}

export async function getCreneauxDisponibles(
  prestationId: string,
  jour: string,
): Promise<Slot[]> {
  const supabase = await createClient();

  const [{ data: prestation }, { data: reglages }, { data: dispo }, { data: indispos }, { data: reservations }] =
    await Promise.all([
      supabase.from("prestations").select("duree_minutes").eq("id", prestationId).single(),
      supabase.from("reglages").select("battement_minutes").eq("id", 1).single(),
      supabase
        .from("disponibilites_recurrentes")
        .select("ouvert, heure_debut, heure_fin")
        .eq("jour_semaine", jourSemaineDe(jour))
        .single(),
      supabase
        .from("indisponibilites")
        .select("heure_debut, heure_fin")
        .lte("date_debut", jour)
        .gte("date_fin", jour),
      // RLS interdit à anon de lire reservations directement (vie privée) :
      // cette RPC (SECURITY DEFINER) n'expose que les plages horaires.
      supabase.rpc("creneaux_occupes_le", { p_jour: jour }),
    ]);

  if (!prestation || !dispo || !reglages) return [];

  return calculerCreneaux({
    dureeMinutes: prestation.duree_minutes,
    battementMinutes: reglages.battement_minutes,
    dispoJour: {
      ouvert: dispo.ouvert,
      heureDebut: dispo.heure_debut,
      heureFin: dispo.heure_fin,
    },
    indisponibilites: (indispos ?? []).map((i) => ({
      heureDebut: i.heure_debut,
      heureFin: i.heure_fin,
    })),
    reservationsExistantes: (
      (reservations ?? []) as { heure_debut: string; heure_fin: string }[]
    ).map((r) => ({
      heureDebut: r.heure_debut,
      heureFin: r.heure_fin,
    })),
  });
}

export async function getJoursOuverts(): Promise<number[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("disponibilites_recurrentes")
    .select("jour_semaine")
    .eq("ouvert", true);
  return (data ?? []).map((d) => d.jour_semaine);
}

export type ReservationInput = {
  prestationId: string;
  jour: string;
  heure: string;
  nom: string;
  email: string;
  telephone: string;
};

export type ReservationResult =
  | { ok: true; jour: string; heure: string }
  | { ok: false; conflit: true }
  | { ok: false; conflit: false; erreur: string };

// UUID de l'unique praticienne au lancement (voir supabase/seed.sql).
// Reste correct pour ADR-0001 : chaque Réservation est rattachée à une
// praticienne, prêt pour un futur multi-praticienne.
const PRATICIENNE_ID = "11111111-1111-4111-8111-111111111111";

export async function creerReservation(input: ReservationInput): Promise<ReservationResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("creer_reservation", {
    p_prestation_id: input.prestationId,
    p_praticienne_id: PRATICIENNE_ID,
    p_jour: input.jour,
    p_heure_debut: input.heure,
    p_nom: input.nom,
    p_email: input.email,
    p_telephone: input.telephone || null,
  });

  if (error) {
    // ADR-0001 : conflit de créneau au lancement -> message explicite,
    // jamais une erreur opaque.
    if (error.code === "23P01") {
      return { ok: false, conflit: true };
    }
    return { ok: false, conflit: false, erreur: error.message };
  }

  return { ok: true, jour: data.jour, heure: data.heure_debut };
}
