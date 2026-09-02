"use client";

import { useState } from "react";
import type { DispoRecurrente } from "@/lib/data/disponibilites";
import { enregistrerSemaineType } from "@/lib/actions/disponibilites-admin";

const NOMS_JOURS: Record<number, string> = {
  1: "Lundi",
  2: "Mardi",
  3: "Mercredi",
  4: "Jeudi",
  5: "Vendredi",
  6: "Samedi",
  0: "Dimanche",
};
const ORDRE_AFFICHAGE = [1, 2, 3, 4, 5, 6, 0];

const HEURES: string[] = [];
for (let h = 8; h <= 20; h++) {
  for (const m of [0, 30]) {
    HEURES.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }
}

function normHeure(h: string): string {
  return h.slice(0, 5);
}

export default function DisponibilitesClient({ dispos }: { dispos: DispoRecurrente[] }) {
  const [state, setState] = useState(
    dispos.map((d) => ({ ...d, heureDebut: normHeure(d.heureDebut), heureFin: normHeure(d.heureFin) })),
  );
  const [envoi, setEnvoi] = useState(false);
  const [message, setMessage] = useState("");

  function maj(jourSemaine: number, patch: Partial<DispoRecurrente>) {
    setState((prev) => prev.map((d) => (d.jourSemaine === jourSemaine ? { ...d, ...patch } : d)));
  }

  async function enregistrer() {
    setEnvoi(true);
    await enregistrerSemaineType(state);
    setEnvoi(false);
    setMessage("Semaine type enregistrée.");
  }

  const ouverts = state.filter((d) => d.ouvert).length;
  const resume = ouverts
    ? `${ouverts} jours ouverts par semaine.`
    : "Aucun jour ouvert : le site public ne proposera aucun créneau.";

  return (
    <div>
      <div className="font-sans text-[9.5px] font-bold tracking-[0.22em] text-brownred uppercase">
        Semaine type
      </div>
      <h1 className="mt-2 font-serif text-[29px] font-normal md:text-[36px]">
        Disponibilités récurrentes
      </h1>
      <p className="mt-2.5 max-w-[560px] text-[13.5px] leading-[1.6] text-clay">
        Vos horaires habituels, appliqués chaque semaine. Une Indisponibilité datée prime
        toujours sur cette semaine type.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-2.5 md:grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
        {ORDRE_AFFICHAGE.map((jourSemaine) => {
          const d = state.find((x) => x.jourSemaine === jourSemaine)!;
          return (
            <div
              key={jourSemaine}
              className={`rounded-2xl p-[16px_18px] ${d.ouvert ? "bg-white" : "bg-coffee/[0.045]"}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="font-sans text-[11px] font-bold tracking-[0.18em] uppercase">
                  {NOMS_JOURS[jourSemaine]}
                </div>
                <button
                  type="button"
                  onClick={() => maj(jourSemaine, { ouvert: !d.ouvert })}
                  className={`relative h-[29px] w-[52px] flex-none rounded-full border border-coffee/[.14] ${
                    d.ouvert ? "bg-sunflower" : "bg-coffee/[0.14]"
                  }`}
                >
                  <span
                    className="absolute top-[3px] h-[21px] w-[21px] rounded-full bg-white shadow-[0_1px_3px_rgba(32,10,9,0.3)] transition-[left]"
                    style={{ left: d.ouvert ? "26px" : "3px" }}
                  />
                </button>
              </div>
              {d.ouvert ? (
                <div className="mt-3.5 flex items-center gap-2.5">
                  <select
                    value={d.heureDebut}
                    onChange={(e) => maj(jourSemaine, { heureDebut: e.target.value })}
                    className="min-h-[46px] flex-1 rounded-[10px] border border-coffee/[.18] bg-white px-3 text-sm text-coffee"
                  >
                    {HEURES.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                  <span className="font-sans text-[11px] font-bold tracking-[0.14em] text-taupe uppercase">
                    à
                  </span>
                  <select
                    value={d.heureFin}
                    onChange={(e) => maj(jourSemaine, { heureFin: e.target.value })}
                    className="min-h-[46px] flex-1 rounded-[10px] border border-coffee/[.18] bg-white px-3 text-sm text-coffee"
                  >
                    {HEURES.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="mt-3 text-[12.5px] text-taupe">Aucun créneau ouvert ce jour.</div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3.5">
        <button
          type="button"
          disabled={envoi}
          onClick={enregistrer}
          className="min-h-[48px] rounded-full bg-coffee px-[26px] py-[15px] font-sans text-[10.5px] font-bold tracking-[0.15em] text-ivory uppercase disabled:opacity-60"
        >
          {envoi ? "Enregistrement…" : "Enregistrer la semaine type"}
        </button>
        <div className="text-[12.5px] text-clay">{message || resume}</div>
      </div>
    </div>
  );
}
