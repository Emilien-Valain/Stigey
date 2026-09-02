import { createClient } from "@/lib/supabase/server";

export async function getBattementMinutes(): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reglages")
    .select("battement_minutes")
    .eq("id", 1)
    .single();

  if (error) throw error;
  return data.battement_minutes;
}
