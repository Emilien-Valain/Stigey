"use client";

import { useEffect, useState } from "react";
import StatusChip from "@/components/admin/StatusChip";
import Modal from "@/components/admin/Modal";
import {
  annulerReservation,
  listerCreneauxPourReport,
  reporterReservation,
  type CreneauReport,
} from "@/lib/actions/reservations-admin";
import { jourCourtLabel } from "@/lib/calendrier";

type Item = {
  id: string;
  jourIso: string;
  jour: string;
  heure: string;
  nom: string;
  email: string;
  telephone: string;
  prestation: string;
  duree: string;
  // Prix figé à la réservation ("" pour les plus anciennes).
  prix: string;
  statutLabel: string;
  actionnable: boolean;
};

export default function ReservationsClient({
  avenir,
  historique,
}: {
  avenir: Item[];
  historique: Item[];
}) {
  const [tab, setTab] = useState<"avenir" | "histo">("avenir");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);

  const liste = tab === "avenir" ? avenir : historique;
  const trouver = (id: string | null) => liste.find((r) => r.id === id) ?? null;
  const detail = trouver(detailId);
  const report = reportId ? (avenir.find((r) => r.id === reportId) ?? null) : null;
  const cancel = trouver(cancelId);

  function fermerTout() {
    setDetailId(null);
    setReportId(null);
    setCancelId(null);
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <div className="font-sans text-[9.5px] font-bold tracking-[0.22em] text-brownred uppercase">
            Réservations
          </div>
          <h1 className="mt-2 font-serif text-[29px] font-normal md:text-[36px]">
            {tab === "avenir" ? "À venir" : "Historique"}
          </h1>
        </div>
        <div className="flex gap-1.5 rounded-full bg-coffee/[0.06] p-1">
          <button
            type="button"
            onClick={() => setTab("avenir")}
            className={`rounded-full px-[18px] py-2.5 font-sans text-[10px] font-bold tracking-[0.14em] uppercase ${
              tab === "avenir" ? "bg-coffee text-ivory" : "text-clay"
            }`}
          >
            À venir
          </button>
          <button
            type="button"
            onClick={() => setTab("histo")}
            className={`rounded-full px-[18px] py-2.5 font-sans text-[10px] font-bold tracking-[0.14em] uppercase ${
              tab === "histo" ? "bg-coffee text-ivory" : "text-clay"
            }`}
          >
            Historique
          </button>
        </div>
      </div>

      {liste.length === 0 ? (
        <div className="mt-5 rounded-[18px] bg-white p-[44px_26px] text-center">
          <div className="mx-auto h-11 w-11 rounded-full bg-cottonrose" />
          <div className="mt-4 font-serif text-[22px]">
            {tab === "avenir" ? "Aucune réservation à venir" : "Aucune réservation passée"}
          </div>
          <p className="mx-auto mt-2 max-w-[340px] text-[13px] leading-[1.6] text-clay">
            {tab === "avenir"
              ? "Les nouvelles réservations prises sur le site apparaîtront ici."
              : "L'historique se remplira au fil des soins."}
          </p>
        </div>
      ) : (
        <>
          {/* mobile : cartes */}
          <div className="mt-[18px] flex flex-col gap-2.5 md:hidden">
            {liste.map((r) => (
              <div key={r.id} className="rounded-2xl bg-white p-[16px_18px]">
                <div className="flex items-baseline justify-between gap-3">
                  <div className="font-sans text-[10px] font-bold tracking-[0.16em] text-taupe uppercase">
                    {r.jour}
                  </div>
                  <StatusChip label={r.statutLabel} />
                </div>
                <div className="mt-2.5 flex items-baseline gap-3.5">
                  <div className="font-serif text-[21px] leading-none">{r.heure}</div>
                  <div>
                    <div className="text-[15px] font-bold">{r.nom}</div>
                    <div className="mt-0.5 text-[12.5px] text-clay">
                      {r.prestation} · {r.duree}
                    </div>
                  </div>
                </div>
                <div className="mt-3.5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setDetailId(r.id)}
                    className="min-h-[46px] min-w-[96px] flex-1 rounded-full bg-coffee/[0.06] text-[10px] font-bold tracking-[0.14em] text-coffee uppercase"
                  >
                    Détail
                  </button>
                  {r.actionnable && (
                    <>
                      <button
                        type="button"
                        onClick={() => setReportId(r.id)}
                        className="min-h-[46px] min-w-[96px] flex-1 rounded-full bg-sunflower text-[10px] font-bold tracking-[0.14em] text-coffee uppercase"
                      >
                        Reporter
                      </button>
                      <button
                        type="button"
                        onClick={() => setCancelId(r.id)}
                        className="min-h-[46px] min-w-[96px] flex-1 rounded-full border border-brownred/40 text-[10px] font-bold tracking-[0.14em] text-brownred uppercase"
                      >
                        Annuler
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* desktop : tableau */}
          <div className="mt-5 hidden overflow-hidden rounded-[18px] bg-white md:block">
            <div className="grid grid-cols-[1.1fr_1.5fr_1.4fr_1.5fr_0.9fr_1.5fr] gap-2.5 bg-coffee/5 px-5 py-3.5 font-sans text-[9px] font-bold tracking-[0.18em] text-clay uppercase">
              <div>Créneau</div>
              <div>Cliente</div>
              <div>Contact</div>
              <div>Prestation</div>
              <div>Statut</div>
              <div className="text-right">Actions</div>
            </div>
            {liste.map((r) => (
              <div
                key={r.id}
                className="grid grid-cols-[1.1fr_1.5fr_1.4fr_1.5fr_0.9fr_1.5fr] items-center gap-2.5 border-t border-coffee/[0.07] px-5 py-[15px]"
              >
                <div>
                  <div className="font-sans text-[10px] font-bold tracking-[0.13em] text-taupe uppercase">
                    {r.jour}
                  </div>
                  <div className="font-serif text-[19px] leading-tight">{r.heure}</div>
                </div>
                <div className="text-sm font-bold">{r.nom}</div>
                <div className="flex flex-col text-[12.5px] leading-[1.5] text-clay">
                  {r.telephone && (
                    <a href={`tel:${r.telephone}`} className="text-coffee hover:underline">
                      {r.telephone}
                    </a>
                  )}
                  <a href={`mailto:${r.email}`} className="text-coffee hover:underline">
                    {r.email}
                  </a>
                </div>
                <div className="text-[13px]">
                  {r.prestation}
                  <div className="mt-0.5 text-[11.5px] text-taupe">{r.duree}</div>
                </div>
                <div>
                  <StatusChip label={r.statutLabel} />
                </div>
                <div className="flex flex-wrap justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setDetailId(r.id)}
                    className="rounded-full bg-coffee/[0.06] px-3.5 py-2.5 font-sans text-[9.5px] font-bold tracking-[0.12em] text-coffee uppercase"
                  >
                    Détail
                  </button>
                  {r.actionnable && (
                    <>
                      <button
                        type="button"
                        onClick={() => setReportId(r.id)}
                        className="rounded-full bg-sunflower px-3.5 py-2.5 font-sans text-[9.5px] font-bold tracking-[0.12em] text-coffee uppercase"
                      >
                        Reporter
                      </button>
                      <button
                        type="button"
                        onClick={() => setCancelId(r.id)}
                        className="rounded-full border border-brownred/35 px-3.5 py-2.5 font-sans text-[9.5px] font-bold tracking-[0.12em] text-brownred uppercase"
                      >
                        Annuler
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {detail && (
        <Modal onClose={fermerTout}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-sans text-[9.5px] font-bold tracking-[0.2em] text-taupe uppercase">
                Réservation
              </div>
              <div className="mt-1.5 font-serif text-[25px]">{detail.nom}</div>
            </div>
            <StatusChip label={detail.statutLabel} />
          </div>
          <div className="mt-4 flex flex-col">
            <Ligne label="Créneau" valeur={`${detail.jour} · ${detail.heure}`} />
            <Ligne label="Prestation" valeur={detail.prestation} />
            <Ligne label="Durée" valeur={detail.duree} />
            {detail.prix && <Ligne label="Prix" valeur={detail.prix} />}
            <Ligne
              label="Téléphone"
              valeur={detail.telephone || "—"}
              href={detail.telephone ? `tel:${detail.telephone}` : undefined}
            />
            <Ligne label="Email" valeur={detail.email} href={`mailto:${detail.email}`} last />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {detail.actionnable && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setReportId(detail.id);
                    setDetailId(null);
                  }}
                  className="min-h-[48px] min-w-[120px] flex-1 rounded-full bg-sunflower text-[10.5px] font-bold tracking-[0.14em] text-coffee uppercase"
                >
                  Reporter
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCancelId(detail.id);
                    setDetailId(null);
                  }}
                  className="min-h-[48px] min-w-[120px] flex-1 rounded-full border border-brownred/40 text-[10.5px] font-bold tracking-[0.14em] text-brownred uppercase"
                >
                  Annuler
                </button>
              </>
            )}
            <button
              type="button"
              onClick={fermerTout}
              className="min-h-[48px] min-w-[100px] flex-1 rounded-full bg-coffee/[0.07] text-[10.5px] font-bold tracking-[0.14em] text-coffee uppercase"
            >
              Fermer
            </button>
          </div>
        </Modal>
      )}

      {report && <ReportModal item={report} onClose={fermerTout} />}

      {cancel && (
        <Modal onClose={fermerTout} maxWidth="420px">
          <div className="font-serif text-2xl">Annuler cette réservation ?</div>
          <p className="mt-2.5 text-[13.5px] leading-[1.6] text-clay">
            {cancel.nom} · {cancel.jour} · {cancel.heure} · {cancel.prestation}. Le créneau
            redevient disponible et la cliente reçoit l&apos;information.
          </p>
          <div className="mt-[22px] flex gap-2.5">
            <button
              type="button"
              onClick={async () => {
                await annulerReservation(cancel.id);
                fermerTout();
              }}
              className="min-h-[48px] flex-1 rounded-full bg-brownred text-[10.5px] font-bold tracking-[0.14em] text-ivory uppercase"
            >
              Confirmer l&apos;annulation
            </button>
            <button
              type="button"
              onClick={fermerTout}
              className="min-h-[48px] rounded-full bg-coffee/[0.07] px-5 text-[10.5px] font-bold tracking-[0.14em] text-coffee uppercase"
            >
              Retour
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Ligne({
  label,
  valeur,
  href,
  last,
}: {
  label: string;
  valeur: string;
  href?: string;
  last?: boolean;
}) {
  return (
    <div
      className={`flex justify-between gap-3.5 border-t border-coffee/10 py-3 ${last ? "border-b" : ""}`}
    >
      <span className="font-sans text-[10px] font-bold tracking-[0.16em] text-taupe uppercase">
        {label}
      </span>
      {href ? (
        <a href={href} className="text-right text-sm break-all text-coffee underline">
          {valeur}
        </a>
      ) : (
        <span className="text-right text-sm break-all">{valeur}</span>
      )}
    </div>
  );
}

function ReportModal({ item, onClose }: { item: Item; onClose: () => void }) {
  const [creneaux, setCreneaux] = useState<CreneauReport[] | null>(null);
  const [choix, setChoix] = useState<number | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    if (creneaux === null) {
      listerCreneauxPourReport(item.id).then(setCreneaux);
    }
  }, [creneaux, item.id]);

  async function confirmer() {
    if (choix === null || !creneaux) return;
    setEnvoi(true);
    const slot = creneaux[choix];
    const resultat = await reporterReservation(item.id, slot.jour, slot.heure);
    setEnvoi(false);
    if (resultat.ok) {
      onClose();
    } else if (resultat.conflit) {
      setErreur("Ce créneau vient d'être pris. Choisissez-en un autre.");
      setCreneaux(null);
      setChoix(null);
    } else {
      setErreur("Le report n'a pas pu être enregistré.");
    }
  }

  return (
    <Modal onClose={onClose} maxWidth="480px">
      <div className="font-sans text-[9.5px] font-bold tracking-[0.2em] text-taupe uppercase">
        Report
      </div>
      <div className="mt-1.5 font-serif text-2xl">{item.nom}</div>
      <div className="mt-1.5 text-[13px] leading-[1.55] text-clay">
        Créneau actuel : {item.jour} · {item.heure} · {item.prestation}
      </div>

      <div className="mt-5 font-sans text-[9.5px] font-bold tracking-[0.2em] text-taupe uppercase">
        Créneaux disponibles
      </div>
      <div className="mt-2.5 flex flex-col gap-2">
        {creneaux === null ? (
          <div className="text-[12.5px] text-taupe">Recherche des créneaux…</div>
        ) : creneaux.length === 0 ? (
          <div className="text-[12.5px] text-taupe">Aucun créneau libre dans les 2 prochaines semaines.</div>
        ) : (
          creneaux.map((c, i) => (
            <button
              key={`${c.jour}-${c.heure}`}
              type="button"
              onClick={() => setChoix(i)}
              className={`flex min-h-[52px] items-center justify-between gap-3 rounded-xl border px-4 py-3.5 text-left ${
                choix === i ? "border-brownred bg-cottonrose" : "border-coffee/[.14] bg-white"
              }`}
            >
              <span className="text-[14.5px] font-bold">{jourCourtLabel(c.jour)}</span>
              <span className="font-serif text-[19px]">{c.heure}</span>
            </button>
          ))
        )}
      </div>
      <div className="mt-3 text-[11.5px] leading-[1.5] text-taupe">
        Seuls les créneaux compatibles avec la durée de la prestation, la semaine type, les
        indisponibilités et le battement sont proposés.
      </div>

      {erreur && (
        <div className="mt-3 rounded-[10px] bg-brownred/10 px-3.5 py-2.5 text-[12.5px] text-brownred">
          {erreur}
        </div>
      )}

      <div className="mt-5 flex gap-2.5">
        <button
          type="button"
          disabled={choix === null || envoi}
          onClick={confirmer}
          className={`min-h-[48px] flex-1 rounded-full text-[10.5px] font-bold tracking-[0.14em] uppercase ${
            choix === null || envoi ? "bg-coffee/15 text-taupe" : "bg-sunflower text-coffee"
          }`}
        >
          {envoi ? "Enregistrement…" : "Confirmer le report"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="min-h-[48px] rounded-full bg-coffee/[0.07] px-5 text-[10.5px] font-bold tracking-[0.14em] text-coffee uppercase"
        >
          Retour
        </button>
      </div>
    </Modal>
  );
}
