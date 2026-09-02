import { getReservationsAvenir, getReservationsHistorique } from "@/lib/data/reservations";
import { jourCourtLabel } from "@/lib/calendrier";
import { heureLabel } from "@/lib/format";
import ReservationsClient from "./ReservationsClient";

const STATUT_LABELS: Record<string, string> = {
  confirmee: "Confirmée",
  annulee: "Annulée",
  honoree: "Honorée",
  no_show: "No-show",
};

function toItem(r: Awaited<ReturnType<typeof getReservationsAvenir>>[number], actionnable: boolean) {
  return {
    id: r.id,
    jourIso: r.jour,
    jour: jourCourtLabel(r.jour),
    heure: heureLabel(r.heureDebut),
    nom: r.nom,
    email: r.email,
    telephone: r.telephone ?? "",
    prestation: r.prestationNom,
    duree: r.dureeLabel,
    statutLabel: STATUT_LABELS[r.statut] ?? r.statut,
    actionnable: actionnable && r.statut === "confirmee",
  };
}

export default async function ReservationsPage() {
  const [avenir, historique] = await Promise.all([
    getReservationsAvenir(),
    getReservationsHistorique(),
  ]);

  return (
    <ReservationsClient
      avenir={avenir.map((r) => toItem(r, true))}
      historique={historique.map((r) => toItem(r, false))}
    />
  );
}
