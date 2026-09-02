"use client";

import { useState } from "react";
import type { Indisponibilite } from "@/lib/data/indisponibilites";
import { ajouterIndisponibilite, supprimerIndisponibilite } from "@/lib/actions/indisponibilites-admin";

const HEURES: string[] = [];
for (let h = 8; h <= 20; h++) {
  for (const m of [0, 30]) {
    HEURES.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }
}

const MOIS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

function fr(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MOIS[m - 1]} ${y}`;
}

function libelle(i: Pick<Indisponibilite, "dateDebut" | "dateFin">): string {
  return i.dateDebut === i.dateFin
    ? fr(i.dateDebut)
    : `${fr(i.dateDebut)} → ${fr(i.dateFin)}`;
}

function detailTexte(i: Indisponibilite): string {
  if (i.heureDebut && i.heureFin) return `${i.heureDebut.slice(0, 5)} → ${i.heureFin.slice(0, 5)}`;
  if (i.dateDebut === i.dateFin) return "Journée entière";
  const nb = Math.round((+new Date(i.dateFin) - +new Date(i.dateDebut)) / 86400000) + 1;
  return `${nb} journées entières`;
}

export default function IndisponibilitesClient({
  indisponibilites,
}: {
  indisponibilites: Indisponibilite[];
}) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [portee, setPortee] = useState<"jour" | "plage">("jour");
  const [h1, setH1] = useState("09:00");
  const [h2, setH2] = useState("13:00");
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);

  async function ajouter() {
    if (!from || !to) {
      setErreur("Renseignez les deux dates.");
      return;
    }
    if (to < from) {
      setErreur("La date de fin précède la date de début.");
      return;
    }
    if (portee === "plage" && from !== to) {
      setErreur("Une plage horaire ne peut couvrir qu'une seule journée.");
      return;
    }
    setEnvoi(true);
    await ajouterIndisponibilite({
      dateDebut: from,
      dateFin: to,
      heureDebut: portee === "plage" ? h1 : null,
      heureFin: portee === "plage" ? h2 : null,
    });
    setEnvoi(false);
    setErreur("");
    setFrom("");
    setTo("");
  }

  return (
    <div>
      <div className="font-sans text-[9.5px] font-bold tracking-[0.22em] text-brownred uppercase">
        Exceptions datées
      </div>
      <h1 className="mt-2 font-serif text-[29px] font-normal md:text-[36px]">Indisponibilités</h1>
      <p className="mt-2.5 max-w-[560px] text-[13.5px] leading-[1.6] text-clay">
        Une seule notion pour tout fermer : une journée, une matinée, ou une semaine entière de
        congés.
      </p>

      <div className="mt-5 grid grid-cols-1 items-start gap-3.5 md:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[18px] bg-coffee p-5 text-ivory">
          <div className="font-serif text-xl">Poser une indisponibilité</div>
          <div className="mt-4 flex flex-col gap-3.5">
            <label className="block">
              <span className="mb-1.5 block font-sans text-[9px] font-bold tracking-[0.2em] text-taupe uppercase">
                Du
              </span>
              <input
                type="date"
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value);
                  setErreur("");
                }}
                className="min-h-[48px] w-full rounded-[10px] border border-ivory/20 bg-ivory/10 px-3.5 text-sm text-ivory"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block font-sans text-[9px] font-bold tracking-[0.2em] text-taupe uppercase">
                Au (même date pour une seule journée)
              </span>
              <input
                type="date"
                value={to}
                onChange={(e) => {
                  setTo(e.target.value);
                  setErreur("");
                }}
                className="min-h-[48px] w-full rounded-[10px] border border-ivory/20 bg-ivory/10 px-3.5 text-sm text-ivory"
              />
            </label>
            <div>
              <label className="mb-1.5 block font-sans text-[9px] font-bold tracking-[0.2em] text-taupe uppercase">
                Étendue
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPortee("jour")}
                  className={`min-h-[46px] flex-1 rounded-full border border-ivory/20 text-[9.5px] font-bold tracking-[0.12em] uppercase ${
                    portee === "jour" ? "bg-sunflower text-coffee" : "text-cottonrose"
                  }`}
                >
                  Journées entières
                </button>
                <button
                  type="button"
                  onClick={() => setPortee("plage")}
                  className={`min-h-[46px] flex-1 rounded-full border border-ivory/20 text-[9.5px] font-bold tracking-[0.12em] uppercase ${
                    portee === "plage" ? "bg-sunflower text-coffee" : "text-cottonrose"
                  }`}
                >
                  Plage horaire
                </button>
              </div>
            </div>
            {portee === "plage" && (
              <div className="flex items-center gap-2.5">
                <select
                  value={h1}
                  onChange={(e) => setH1(e.target.value)}
                  className="min-h-[46px] flex-1 rounded-[10px] border border-ivory/20 bg-ivory/10 px-3 text-sm text-ivory"
                >
                  {HEURES.map((h) => (
                    <option key={h} value={h} className="text-coffee">
                      {h}
                    </option>
                  ))}
                </select>
                <span className="font-sans text-[11px] font-bold tracking-[0.14em] text-taupe uppercase">
                  à
                </span>
                <select
                  value={h2}
                  onChange={(e) => setH2(e.target.value)}
                  className="min-h-[46px] flex-1 rounded-[10px] border border-ivory/20 bg-ivory/10 px-3 text-sm text-ivory"
                >
                  {HEURES.map((h) => (
                    <option key={h} value={h} className="text-coffee">
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {erreur && (
              <div className="rounded-[10px] bg-cottonrose/15 px-3.5 py-2.5 text-[12.5px] text-cottonrose">
                {erreur}
              </div>
            )}
            <button
              type="button"
              disabled={envoi}
              onClick={ajouter}
              className="min-h-[48px] rounded-full bg-sunflower text-[10.5px] font-bold tracking-[0.15em] text-coffee uppercase disabled:opacity-60"
            >
              {envoi ? "Enregistrement…" : "Poser l'indisponibilité"}
            </button>
          </div>
        </div>

        <div>
          <div className="font-sans text-[9.5px] font-bold tracking-[0.2em] text-taupe uppercase">
            Déjà posées
          </div>
          {indisponibilites.length === 0 && (
            <div className="mt-3 rounded-2xl bg-white p-[34px_22px] text-center">
              <div className="font-serif text-[19px]">Aucune indisponibilité</div>
              <p className="mt-1.5 text-[12.5px] leading-[1.55] text-clay">
                Votre semaine type s&apos;applique sans exception.
              </p>
            </div>
          )}
          <div className="mt-3 flex flex-col gap-2.5">
            {indisponibilites.map((i) => (
              <div
                key={i.id}
                className="flex items-center justify-between gap-3 rounded-2xl bg-white p-[15px_17px]"
              >
                <div className="min-w-0">
                  <div className="text-[14.5px] font-bold">{libelle(i)}</div>
                  <div className="mt-0.5 text-xs text-taupe">{detailTexte(i)}</div>
                </div>
                <button
                  type="button"
                  onClick={() => supprimerIndisponibilite(i.id)}
                  className="min-h-[44px] flex-none rounded-full border border-brownred/35 px-4 text-[9.5px] font-bold tracking-[0.13em] text-brownred uppercase"
                >
                  Supprimer
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
