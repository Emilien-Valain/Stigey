"use server";

import { createClient } from "@/lib/supabase/server";
import { calculerCreneaux, type Slot } from "@/lib/creneaux";
import { emailValide } from "@/lib/validation";
import { envoyerConfirmation, envoyerNotificationPraticienne } from "@/lib/notify/reservation-emails";
import { estDeadlock } from "@/lib/db-erreurs";

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

// UUID de l'unique praticienne. Par défaut le seed local (voir
// supabase/seed.sql) ; en production ce n'est pas le même utilisateur Auth,
// donc PRATICIENNE_ID doit être défini côté Vercel avec le vrai UUID.
// Reste correct pour ADR-0001 : chaque Réservation est rattachée à une
// praticienne, prêt pour un futur multi-praticienne.
const PRATICIENNE_ID = process.env.PRATICIENNE_ID ?? "11111111-1111-4111-8111-111111111111";

export async function creerReservation(input: ReservationInput): Promise<ReservationResult> {
  if (!emailValide(input.email)) {
    return { ok: false, conflit: false, erreur: "Email invalide." };
  }

  const supabase = await createClient();
  const rpcArgs = {
    p_prestation_id: input.prestationId,
    p_praticienne_id: PRATICIENNE_ID,
    p_jour: input.jour,
    p_heure_debut: input.heure,
    p_nom: input.nom,
    p_email: input.email,
    p_telephone: input.telephone || null,
  };
  let resultat = await supabase.rpc("creer_reservation", rpcArgs);

  // Deadlock sous vraie concurrence : transitoire, pas un vrai conflit de
  // créneau -> on retente une fois avant de conclure quoi que ce soit.
  if (resultat.error && estDeadlock(resultat.error)) {
    resultat = await supabase.rpc("creer_reservation", rpcArgs);
  }

  const { data, error } = resultat;

  if (error) {
    // ADR-0001 : conflit de créneau au lancement -> message explicite,
    // jamais une erreur opaque.
    if (error.code === "23P01") {
      return { ok: false, conflit: true };
    }
    console.error("creer_reservation RPC error:", JSON.stringify(error));
    return { ok: false, conflit: false, erreur: error.message };
  }

  const { data: prestation } = await supabase
    .from("prestations")
    .select("nom")
    .eq("id", data.prestation_id)
    .single();

  // Best-effort (les fonctions d'envoi avalent leurs propres erreurs) : on
  // attend l'envoi avant de répondre, sinon un runtime serverless peut
  // couper la fonction avant qu'une promesse "en arrière-plan" n'ait fini
  // d'envoyer.
  const emailReservation = {
    id: data.id,
    jour: data.jour,
    heureDebut: data.heure_debut,
    heureFin: data.heure_fin,
    nom: data.nom,
    email: data.email,
    telephone: data.telephone,
    icsSequence: data.ics_sequence,
    prestationNom: prestation?.nom ?? "",
  };
  await Promise.all([
    envoyerConfirmation(emailReservation),
    envoyerNotificationPraticienne(emailReservation),
  ]);

  return { ok: true, jour: data.jour, heure: data.heure_debut };
}
