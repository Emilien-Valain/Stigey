import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Client "service role" : contourne RLS. Réservé aux tâches serveur de
// confiance protégées par un secret propre (le cron des rappels), jamais à
// une requête déclenchée par un visiteur ou par la praticienne — celles-ci
// passent par src/lib/supabase/server.ts (session + RLS).
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY (ou NEXT_PUBLIC_SUPABASE_URL) manquante.");
  }
  return createSupabaseClient(url, key, { auth: { persistSession: false } });
}
