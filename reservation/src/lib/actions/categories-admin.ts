"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { estPraticienneConnectee } from "@/lib/supabase/praticienne";
import { messageCatalogue } from "@/lib/db-erreurs";
import { uuidValide, validerCategorie, validerOrdre } from "@/lib/validation";
import { NON_CONNECTEE, type ResultatAction } from "./resultat";

function revalider() {
  revalidatePath("/admin/prestations");
  revalidatePath("/");
  revalidatePath("/prestations");
  revalidatePath("/reservation");
}

export async function creerCategorie(input: unknown): Promise<ResultatAction> {
  const supabase = await createClient();
  if (!(await estPraticienneConnectee(supabase))) return NON_CONNECTEE;

  const validation = validerCategorie(input);
  if (!validation.ok) return { error: validation.erreur };

  const { error } = await supabase.from("categories_prestations").insert({ nom: validation.valeur.nom });
  if (error) return { error: messageCatalogue(error) };
  revalider();
  return {};
}

export async function renommerCategorie(id: unknown, input: unknown): Promise<ResultatAction> {
  const supabase = await createClient();
  if (!(await estPraticienneConnectee(supabase))) return NON_CONNECTEE;

  const validation = validerCategorie(input);
  if (!uuidValide(id)) return { error: "Catégorie invalide." };
  if (!validation.ok) return { error: validation.erreur };

  const { error } = await supabase
    .from("categories_prestations")
    .update({ nom: validation.valeur.nom })
    .eq("id", id);
  if (error) return { error: messageCatalogue(error) };
  revalider();
  return {};
}

// Désactivation, comme pour les prestations : refusée par la base tant que la
// catégorie contient des soins actifs (trigger categorie_non_vide).
export async function supprimerCategorie(id: unknown): Promise<ResultatAction> {
  const supabase = await createClient();
  if (!(await estPraticienneConnectee(supabase))) return NON_CONNECTEE;
  if (!uuidValide(id)) return { error: "Catégorie invalide." };

  const { error } = await supabase
    .from("categories_prestations")
    .update({ actif: false })
    .eq("id", id);
  if (error) return { error: messageCatalogue(error) };
  revalider();
  return {};
}

export async function reordonnerCategories(ids: unknown): Promise<ResultatAction> {
  const supabase = await createClient();
  if (!(await estPraticienneConnectee(supabase))) return NON_CONNECTEE;

  const ordre = validerOrdre(ids);
  if (!ordre.ok) return { error: ordre.erreur };

  const { error } = await supabase.rpc("reordonner_categories", { p_ids: ordre.valeur });
  if (error) return { error: messageCatalogue(error) };
  revalider();
  return {};
}
