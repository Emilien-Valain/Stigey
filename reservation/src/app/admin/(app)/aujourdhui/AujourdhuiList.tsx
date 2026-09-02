"use client";

import { useState } from "react";
import Link from "next/link";
import StatusChip from "@/components/admin/StatusChip";
import { marquerHonoree, marquerNoShow } from "@/lib/actions/reservations-admin";

type Item = {
  id: string;
  heure: string;
  nom: string;
  prestation: string;
  duree: string;
  statutLabel: string;
  aQualifier: boolean;
};

export default function AujourdhuiList({ items }: { items: Item[] }) {
  const [pending, setPending] = useState<string | null>(null);
  const nbAQualifier = items.filter((i) => i.aQualifier).length;

  async function qualifier(id: string, action: (id: string) => Promise<void>) {
    setPending(id);
    await action(id);
    setPending(null);
  }

  if (items.length === 0) {
    return (
      <div className="mt-[22px] rounded-[18px] bg-white p-[44px_26px] text-center">
        <div className="mx-auto h-11 w-11 rounded-full bg-cottonrose" />
        <div className="mt-4 font-serif text-[22px]">Aucune réservation aujourd&apos;hui</div>
        <p className="mx-auto mt-2 max-w-[340px] text-[13px] leading-[1.6] text-clay">
          Rien au programme. Vous pouvez poser une Indisponibilité ou ajuster vos Disponibilités
          récurrentes.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2.5">
          <Link
            href="/admin/indisponibilites"
            className="rounded-full bg-coffee px-5 py-3 font-sans text-[10px] font-bold tracking-[0.14em] text-ivory uppercase"
          >
            Poser une indisponibilité
          </Link>
          <Link
            href="/admin/disponibilites"
            className="rounded-full border border-coffee/25 px-5 py-3 font-sans text-[10px] font-bold tracking-[0.14em] text-coffee uppercase"
          >
            Disponibilités récurrentes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-[18px] flex flex-col gap-2.5">
      {nbAQualifier === 0 && (
        <div className="flex items-center gap-3 rounded-2xl bg-coffee p-[16px_18px]">
          <span className="h-2 w-2 flex-none rounded-full bg-sunflower" />
          <div className="text-[13px] text-ivory">
            Toutes les Réservations du jour sont qualifiées. Rien à traiter.
          </div>
        </div>
      )}

      {items.map((r) => (
        <div
          key={r.id}
          className={`rounded-2xl border-l-[3px] bg-white p-[16px_18px] ${
            r.aQualifier ? "border-sunflower" : "border-white"
          }`}
        >
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div className="flex min-w-0 items-baseline gap-3.5">
              <div className="font-serif text-[22px] leading-none">{r.heure}</div>
              <div className="min-w-0">
                <div className="text-[15px] font-bold">{r.nom}</div>
                <div className="mt-0.5 text-[12.5px] text-clay">
                  {r.prestation} · {r.duree}
                </div>
              </div>
            </div>
            <StatusChip label={r.statutLabel} />
          </div>
          {r.aQualifier && (
            <div className="mt-3.5 flex gap-2.5">
              <button
                type="button"
                disabled={pending === r.id}
                onClick={() => qualifier(r.id, marquerHonoree)}
                className="min-h-[46px] flex-1 rounded-full bg-sunflower text-[10.5px] font-bold tracking-[0.14em] text-coffee uppercase disabled:opacity-60"
              >
                Honorée
              </button>
              <button
                type="button"
                disabled={pending === r.id}
                onClick={() => qualifier(r.id, marquerNoShow)}
                className="min-h-[46px] flex-1 rounded-full border border-brownred/40 text-[10.5px] font-bold tracking-[0.14em] text-brownred uppercase disabled:opacity-60"
              >
                No-show
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
