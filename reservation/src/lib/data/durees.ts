import type { SupabaseClient } from "@supabase/supabase-js";
import { tarifDe } from "@/lib/catalogue";

// Durée (minutes) à réserver pour une Prestation et, si elle en a, la
// Variante choisie. `null` si la sélection est incohérente (voir `tarifDe`).
// Lecture RLS de l'appelant : anon ne voit que les Prestations et Variantes
// actives, ce qui est voulu pour la prise de rendez-vous publique.
export async function dureeReservable(
  supabase: SupabaseClient,
  prestationId: string,
  varianteId?: string | null,
): Promise<number | null> {
  const { data } = await supabase
    .from("prestations")
    .select("duree_minutes, prix_centimes, variantes_prestations(id, duree_minutes, prix_centimes)")
    .eq("id", prestationId)
    .eq("variantes_prestations.actif", true)
    .maybeSingle();
  if (!data) return null;

  const tarif = tarifDe(
    {
      dureeMinutes: data.duree_minutes,
      prixCentimes: data.prix_centimes,
      variantes: (data.variantes_prestations ?? []).map((v) => ({
        id: v.id,
        dureeMinutes: v.duree_minutes,
        prixCentimes: v.prix_centimes,
      })),
    },
    varianteId,
  );
  return tarif?.dureeMinutes ?? null;
}
