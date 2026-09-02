"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function login(email: string, password: string): Promise<{ error?: string }> {
  if (!email.trim() || !password.trim()) {
    return { error: "Renseignez votre email et votre mot de passe." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Email ou mot de passe incorrect." };

  redirect("/admin/aujourdhui");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin");
}

export async function demanderLienMdp(email: string): Promise<{ error?: string }> {
  if (!email.trim()) return { error: "Renseignez votre email." };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) return { error: error.message };
  return {};
}
