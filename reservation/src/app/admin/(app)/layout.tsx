import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getReservationsDuJour } from "@/lib/data/reservations";
import AdminShell from "@/components/admin/AdminShell";

export default async function AdminAppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Le middleware protège déjà /admin/*, on revérifie ici en défense en
  // profondeur (recommandation Supabase : ne jamais se fier au seul middleware).
  if (!user) redirect("/admin");

  const nom = (user.user_metadata?.full_name as string | undefined) ?? user.email ?? "";

  const heureActuelle = new Date().toTimeString().slice(0, 8);
  const aujourdhui = await getReservationsDuJour();
  const nbAQualifier = aujourdhui.filter(
    (r) => r.statut === "confirmee" && r.heureFin < heureActuelle,
  ).length;

  return (
    <AdminShell nom={nom} nbAQualifier={nbAQualifier}>
      {children}
    </AdminShell>
  );
}
