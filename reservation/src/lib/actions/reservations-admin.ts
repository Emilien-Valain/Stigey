"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { calculerCreneaux } from "@/lib/creneaux";
import { toISODate } from "@/lib/calendrier";

function minutesEntre(debut: string, fin: string): number {
  const [dh, dm] = debut.split(":").map(Number);
  const [fh, fm] = fin.split(":").map(Number);
  return fh * 60 + fm - (dh * 60 + dm);
}

function ajouterMinutes(heure: string, minutes: number): string {
  const [h, m] = heure.split(":").map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function revalider() {
  revalidatePath("/admin/aujourdhui");
  revalidatePath("/admin/reservations");
}

async function updateStatut(id: string, statut: "honoree" | "no_show" | "annulee") {
  const supabase = await createClient();
  const { error } = await supabase.from("reservations").update({ statut }).eq("id", id);
  if (error) throw error;
  revalider();
}

export async function marquerHonoree(id: string) {
  await updateStatut(id, "honoree");
}

export async function marquerNoShow(id: string) {
  await updateStatut(id, "no_show");
}

export async function annulerReservation(id: string) {
  await updateStatut(id, "annulee");
}

export type ReportResult =
  | { ok: true }
  | { ok: false; conflit: true }
  | { ok: false; conflit: false; erreur: string };

// ADR-0001 : le Report percute la même contrainte d'exclusion que la
// réservation publique — pas de chemin séparé qui pourrait la contourner.
export async function reporterReservation(
  id: string,
  jour: string,
  heureDebut: string,
): Promise<ReportResult> {
  const supabase = await createClient();
  const { data: existante, error: fetchError } = await supabase
    .from("reservations")
    .select("heure_debut, heure_fin")
    .eq("id", id)
    .single();

  if (fetchError) return { ok: false, conflit: false, erreur: fetchError.message };

  const duree = minutesEntre(existante.heure_debut, existante.heure_fin);
  const heureFin = ajouterMinutes(heureDebut, duree);

  const { error } = await supabase
    .from("reservations")
    .update({ jour, heure_debut: heureDebut, heure_fin: heureFin })
    .eq("id", id);

  if (error) {
    if (error.code === "23P01") return { ok: false, conflit: true };
    return { ok: false, conflit: false, erreur: error.message };
  }

  revalider();
  return { ok: true };
}

export type CreneauReport = { jour: string; heure: string };

// Créneaux libres pour reporter une Réservation : mêmes règles que la prise
// publique (ADR-0006), en excluant la Réservation qu'on déplace elle-même de
// la liste des occupations (sinon elle se bloquerait son propre créneau).
export async function listerCreneauxPourReport(
  reservationId: string,
  joursACouvrir = 14,
  maxResultats = 6,
): Promise<CreneauReport[]> {
  const supabase = await createClient();

  const { data: resa } = await supabase
    .from("reservations")
    .select("prestation_id")
    .eq("id", reservationId)
    .single();
  if (!resa) return [];

  const [{ data: prestation }, { data: reglages }, { data: dispos }] = await Promise.all([
    supabase.from("prestations").select("duree_minutes").eq("id", resa.prestation_id).single(),
    supabase.from("reglages").select("battement_minutes").eq("id", 1).single(),
    supabase.from("disponibilites_recurrentes").select("jour_semaine, ouvert, heure_debut, heure_fin"),
  ]);
  if (!prestation || !reglages || !dispos) return [];

  const debut = new Date();
  debut.setDate(debut.getDate() + 1);
  const fin = new Date(debut);
  fin.setDate(fin.getDate() + joursACouvrir);

  const [{ data: indispos }, { data: reservations }] = await Promise.all([
    supabase
      .from("indisponibilites")
      .select("date_debut, date_fin, heure_debut, heure_fin")
      .lte("date_debut", toISODate(fin))
      .gte("date_fin", toISODate(debut)),
    supabase
      .from("reservations")
      .select("jour, heure_debut, heure_fin")
      .gte("jour", toISODate(debut))
      .lte("jour", toISODate(fin))
      .neq("statut", "annulee")
      .neq("id", reservationId),
  ]);

  const dispoParJour = new Map(dispos.map((d) => [d.jour_semaine, d]));
  const resultats: CreneauReport[] = [];

  for (let d = new Date(debut); d <= fin && resultats.length < maxResultats; d.setDate(d.getDate() + 1)) {
    const jourIso = toISODate(d);
    const dispo = dispoParJour.get(d.getDay());
    if (!dispo) continue;

    const slots = calculerCreneaux({
      dureeMinutes: prestation.duree_minutes,
      battementMinutes: reglages.battement_minutes,
      dispoJour: { ouvert: dispo.ouvert, heureDebut: dispo.heure_debut, heureFin: dispo.heure_fin },
      indisponibilites: (indispos ?? [])
        .filter((i) => jourIso >= i.date_debut && jourIso <= i.date_fin)
        .map((i) => ({ heureDebut: i.heure_debut, heureFin: i.heure_fin })),
      reservationsExistantes: (reservations ?? [])
        .filter((r) => r.jour === jourIso)
        .map((r) => ({ heureDebut: r.heure_debut, heureFin: r.heure_fin })),
    });

    for (const s of slots) {
      if (s.libre && resultats.length < maxResultats) resultats.push({ jour: jourIso, heure: s.heure });
    }
  }

  return resultats;
}
