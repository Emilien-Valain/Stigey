import type { SupabaseClient } from "@supabase/supabase-js";

// Une Server Action est joignable en POST direct, sans passer par l'UI ni par
// le proxy (voir doc Next.js « data-security ») : chaque action admin
// revérifie elle-même la session, en plus de la RLS. getUser() valide le
// jeton auprès de Supabase (getSession() ne fait que lire le cookie).
// Volontairement hors d'un fichier "use server" : ne doit jamais être exposé
// comme action.
export async function estPraticienneConnectee(supabase: SupabaseClient): Promise<boolean> {
  const { data, error } = await supabase.auth.getUser();
  return !error && data.user !== null;
}
