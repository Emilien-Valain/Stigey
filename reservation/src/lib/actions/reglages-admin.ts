"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function enregistrerBattement(minutes: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("reglages")
    .update({ battement_minutes: minutes })
    .eq("id", 1);

  if (error) throw error;
  revalidatePath("/admin/reglages");
  revalidatePath("/reservation");
}
