import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { envoyerRappel } from "@/lib/notify/reservation-emails";
import { toISODate } from "@/lib/calendrier";

// Rappel anti-no-show à ~48 h (ADR-0002), déclenché une fois par jour par le
// cron Vercel (voir vercel.json). Sécurité : Vercel envoie automatiquement
// `Authorization: Bearer $CRON_SECRET` sur les requêtes cron dès que la
// variable d'env CRON_SECRET est définie — voir doc Vercel "Securing cron
// jobs". `rappel_envoye` rend l'opération idempotente (délivrance "best
// effort" par Vercel : un run peut se dupliquer ou manquer).
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const dansDeuxJours = new Date();
  dansDeuxJours.setDate(dansDeuxJours.getDate() + 2);
  const jourCible = toISODate(dansDeuxJours);

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("reservations")
    .select("id, jour, heure_debut, heure_fin, nom, email, ics_sequence, prestations(nom)")
    .eq("jour", jourCible)
    .eq("statut", "confirmee")
    .eq("rappel_envoye", false);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let envoyes = 0;
  for (const r of data ?? []) {
    await envoyerRappel({
      id: r.id,
      jour: r.jour,
      heureDebut: r.heure_debut,
      heureFin: r.heure_fin,
      nom: r.nom,
      email: r.email,
      icsSequence: r.ics_sequence,
      prestationNom: (r.prestations as unknown as { nom: string } | null)?.nom ?? "",
    });
    await supabase.from("reservations").update({ rappel_envoye: true }).eq("id", r.id);
    envoyes++;
  }

  return NextResponse.json({ jourCible, envoyes });
}
