import { getReservationsDuJour } from "@/lib/data/reservations";
import { jourLabel } from "@/lib/calendrier";
import { heureLabel } from "@/lib/format";
import AujourdhuiList from "./AujourdhuiList";

export default async function AujourdhuiPage() {
  const reservations = await getReservationsDuJour();
  const heureActuelle = new Date().toTimeString().slice(0, 8);

  const items = reservations.map((r) => {
    const aQualifier = r.statut === "confirmee" && r.heureFin < heureActuelle;
    const label =
      r.statut === "honoree"
        ? "Honorée"
        : r.statut === "no_show"
          ? "No-show"
          : r.statut === "annulee"
            ? "Annulée"
            : aQualifier
              ? "Confirmée"
              : "À venir";
    return {
      id: r.id,
      heure: heureLabel(r.heureDebut),
      nom: r.nom,
      prestation: r.prestationNom,
      duree: r.dureeLabel,
      statutLabel: label,
      aQualifier,
    };
  });

  const nbAQualifier = items.filter((i) => i.aQualifier).length;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <div className="font-sans text-[9.5px] font-bold tracking-[0.22em] text-brownred uppercase">
            Aujourd&apos;hui
          </div>
          <h1 className="mt-2 font-serif text-[29px] font-normal md:text-[36px]">
            {jourLabel(new Date())}
          </h1>
        </div>
        <div className="flex gap-2.5">
          <div className="min-w-[96px] rounded-[14px] bg-white p-[11px_16px]">
            <div className="font-serif text-[26px] leading-none">{items.length}</div>
            <div className="mt-1.5 font-sans text-[9px] font-bold tracking-[0.16em] text-taupe uppercase">
              Réservations
            </div>
          </div>
          <div className="min-w-[96px] rounded-[14px] bg-sunflower p-[11px_16px]">
            <div className="font-serif text-[26px] leading-none">{nbAQualifier}</div>
            <div className="mt-1.5 font-sans text-[9px] font-bold tracking-[0.16em] text-[#6b4a12] uppercase">
              À qualifier
            </div>
          </div>
        </div>
      </div>

      <AujourdhuiList items={items} />
    </div>
  );
}
