"use client";

import { useState } from "react";
import { enregistrerBattement } from "@/lib/actions/reglages-admin";

const OPTIONS = [0, 5, 10, 15, 20, 30];

export default function ReglagesClient({ battementInitial }: { battementInitial: number }) {
  const [battement, setBattement] = useState(battementInitial);
  const [envoi, setEnvoi] = useState(false);
  const [message, setMessage] = useState("");

  async function enregistrer() {
    setEnvoi(true);
    await enregistrerBattement(battement);
    setEnvoi(false);
    setMessage(`Battement enregistré : ${battement} min`);
  }

  return (
    <div>
      <div className="font-sans text-[9.5px] font-bold tracking-[0.22em] text-brownred uppercase">
        Réglages
      </div>
      <h1 className="mt-2 font-serif text-[29px] font-normal md:text-[36px]">Battement</h1>

      <div className="mt-5 max-w-[620px] rounded-[18px] bg-white p-6">
        <p className="text-[13.5px] leading-[1.65] text-clay">
          Temps tampon ajouté après chaque soin. Il rend le créneau suivant indisponible
          d&apos;autant, le temps de remettre le bac et la cabine en état.
        </p>
        <div className="mt-[22px] flex items-baseline gap-2.5">
          <div className="font-serif text-[52px] leading-none">{battement}</div>
          <div className="font-sans text-[11px] font-bold tracking-[0.18em] text-taupe uppercase">
            minutes
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {OPTIONS.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => {
                setBattement(v);
                setMessage("");
              }}
              className={`min-h-[46px] rounded-full border px-5 text-[11px] font-bold tracking-[0.12em] uppercase ${
                battement === v
                  ? "border-coffee bg-coffee text-ivory"
                  : "border-coffee/[.18] bg-white text-coffee"
              }`}
            >
              {v === 0 ? "Aucun" : `${v} min`}
            </button>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3.5 border-t border-coffee/[0.09] pt-5">
          <button
            type="button"
            disabled={envoi}
            onClick={enregistrer}
            className="min-h-[48px] rounded-full bg-coffee px-[26px] py-[15px] font-sans text-[10.5px] font-bold tracking-[0.15em] text-ivory uppercase disabled:opacity-60"
          >
            {envoi ? "Enregistrement…" : "Enregistrer"}
          </button>
          <div className="text-[12.5px] text-taupe">{message || "Par défaut : 0 minute."}</div>
        </div>
      </div>
    </div>
  );
}
