"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { estPraticienneConnectee } from "@/lib/supabase/praticienne";
import { messageCatalogue } from "@/lib/db-erreurs";
import { listerImagesPrestations } from "@/lib/images-prestations";
import { uuidValide, validerOrdre, validerPrestation } from "@/lib/validation";
import { NON_CONNECTEE, type ResultatAction } from "./resultat";

function revalider() {
  revalidatePath("/admin/prestations");
  revalidatePath("/");
  revalidatePath("/prestations");
  revalidatePath("/reservation");
}

// `input` est `unknown` à dessein : l'action est appelable en POST direct,
// le typage TypeScript ne protège pas à l'exécution.
export async function enregistrerPrestation(input: unknown): Promise<ResultatAction> {
  const supabase = await createClient();
  if (!(await estPraticienneConnectee(supabase))) return NON_CONNECTEE;

  const validation = validerPrestation(input);
  if (!validation.ok) return { error: validation.erreur };
  const p = validation.valeur;

  if (p.image && !(await listerImagesPrestations()).includes(p.image)) {
    return { error: "Image introuvable." };
  }

  // Prestation et Variantes s'enregistrent ensemble, en une transaction : une
  // erreur en cours de route ne laisse pas une Prestation sans tarif.
  const { error } = await supabase.rpc("enregistrer_prestation", {
    p_id: p.id ?? null,
    p_donnees: {
      nom: p.nom,
      categorie_id: p.categorieId,
      duree_minutes: p.dureeMinutes,
      prix_centimes: p.prixCentimes,
      accroche: p.accroche,
      description: p.description,
      cible: p.cible,
      mise_en_avant: p.miseEnAvant,
      image_url: p.image,
    },
    p_variantes: p.variantes.map((v) => ({
      ...(v.id ? { id: v.id } : {}),
      nom: v.nom,
      duree_minutes: v.dureeMinutes,
      prix_centimes: v.prixCentimes,
    })),
  });

  if (error) return { error: messageCatalogue(error) };
  revalider();
  return {};
}

// Désactivation (pas de suppression en base) : la prestation disparaît du
// site public, les Réservations déjà prises la conservent (FK intacte).
export async function desactiverPrestation(id: unknown): Promise<ResultatAction> {
  const supabase = await createClient();
  if (!(await estPraticienneConnectee(supabase))) return NON_CONNECTEE;
  if (!uuidValide(id)) return { error: "Prestation invalide." };

  const { error } = await supabase.from("prestations").update({ actif: false }).eq("id", id);
  if (error) return { error: messageCatalogue(error) };
  revalider();
  return {};
}

export async function reordonnerPrestations(
  categorieId: unknown,
  ids: unknown,
): Promise<ResultatAction> {
  const supabase = await createClient();
  if (!(await estPraticienneConnectee(supabase))) return NON_CONNECTEE;

  const ordre = validerOrdre(ids);
  if (!uuidValide(categorieId) || !ordre.ok) return { error: "Ordre invalide." };

  const { error } = await supabase.rpc("reordonner_prestations", {
    p_categorie_id: categorieId,
    p_ids: ordre.valeur,
  });
  if (error) return { error: messageCatalogue(error) };
  revalider();
  return {};
}
