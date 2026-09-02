"use client";

import { useState } from "react";
import Modal from "@/components/admin/Modal";
import type { Prestation } from "@/lib/data/prestations";
import { enregistrerPrestation, desactiverPrestation } from "@/lib/actions/prestations-admin";

type Form = {
  id?: string;
  nom: string;
  duree: number;
  prix: number;
  accroche: string;
  description: string;
  cible: string;
};

function versForm(p?: Prestation): Form {
  return p
    ? {
        id: p.id,
        nom: p.nom,
        duree: p.dureeMinutes,
        prix: Math.round(p.prixCentimes / 100),
        accroche: p.accroche,
        description: p.description,
        cible: p.cible,
      }
    : { nom: "", duree: 60, prix: 0, accroche: "", description: "", cible: "" };
}

export default function PrestationsClient({ prestations }: { prestations: Prestation[] }) {
  const [form, setForm] = useState<Form | null>(null);
  const [suppression, setSuppression] = useState<Prestation | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

  async function enregistrer() {
    if (!form) return;
    if (!form.nom.trim() || !form.duree) {
      setErreur("Nom et durée sont nécessaires.");
      return;
    }
    setEnvoi(true);
    await enregistrerPrestation({
      id: form.id,
      nom: form.nom,
      dureeMinutes: form.duree,
      prixCentimes: Math.round(form.prix * 100),
      accroche: form.accroche,
      description: form.description,
      cible: form.cible,
    });
    setEnvoi(false);
    setForm(null);
  }

  async function confirmerSuppression() {
    if (!suppression) return;
    await desactiverPrestation(suppression.id);
    setSuppression(null);
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <div className="font-sans text-[9.5px] font-bold tracking-[0.22em] text-brownred uppercase">
            Catalogue
          </div>
          <h1 className="mt-2 font-serif text-[29px] font-normal md:text-[36px]">Prestations</h1>
        </div>
        <button
          type="button"
          onClick={() => {
            setForm(versForm());
            setErreur("");
          }}
          className="min-h-[46px] rounded-full bg-sunflower px-[22px] py-3.5 font-sans text-[10.5px] font-bold tracking-[0.14em] text-coffee uppercase"
        >
          Ajouter une prestation
        </button>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-[repeat(auto-fit,minmax(260px,1fr))]">
        {prestations.map((p) => (
          <div key={p.id} className="flex flex-col rounded-[18px] bg-white p-5">
            <div className="font-serif text-xl leading-tight">{p.nom}</div>
            <div className="mt-2 flex items-center gap-2 font-sans text-[10.5px] font-bold tracking-[0.13em] text-brownred uppercase">
              <span>{p.duree}</span>
              <span className="h-[3px] w-[3px] rounded-full bg-sand" />
              <span>{p.prix}</span>
            </div>
            <p className="mt-3 text-[13px] leading-[1.6] text-clay">{p.accroche}</p>
            <div className="mt-3.5 font-sans text-[9.5px] font-bold tracking-[0.18em] text-taupe uppercase">
              S&apos;adresse à
            </div>
            <p className="mt-1 text-[12.5px] leading-[1.55] text-clay">{p.cible}</p>
            <div className="mt-auto flex gap-2 pt-[18px]">
              <button
                type="button"
                onClick={() => {
                  setForm(versForm(p));
                  setErreur("");
                }}
                className="min-h-[44px] flex-1 rounded-full bg-coffee/[0.06] text-[10px] font-bold tracking-[0.14em] text-coffee uppercase"
              >
                Modifier
              </button>
              <button
                type="button"
                onClick={() => setSuppression(p)}
                className="min-h-[44px] rounded-full border border-brownred/35 px-4 text-[10px] font-bold tracking-[0.14em] text-brownred uppercase"
              >
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>

      {form && (
        <Modal onClose={() => setForm(null)} maxWidth="560px">
          <div className="font-sans text-[9.5px] font-bold tracking-[0.2em] text-taupe uppercase">
            Prestation
          </div>
          <div className="mt-1.5 font-serif text-[25px]">
            {form.id ? "Modifier la prestation" : "Nouvelle prestation"}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3.5 md:grid-cols-2">
            <div className="md:col-span-2">
              <Champ label="Nom">
                <Input value={form.nom} onChange={(v) => setForm({ ...form, nom: v })} />
              </Champ>
            </div>
            <div>
              <Champ label="Durée (minutes)">
                <Input
                  type="number"
                  min={15}
                  step={5}
                  value={String(form.duree)}
                  onChange={(v) => setForm({ ...form, duree: Number(v) })}
                />
              </Champ>
            </div>
            <div>
              <Champ label="Prix (€)">
                <Input
                  type="number"
                  min={0}
                  step={5}
                  value={String(form.prix)}
                  onChange={(v) => setForm({ ...form, prix: Number(v) })}
                />
              </Champ>
            </div>
            <div className="md:col-span-2">
              <Champ label="Accroche courte">
                <Input value={form.accroche} onChange={(v) => setForm({ ...form, accroche: v })} />
              </Champ>
            </div>
            <div className="md:col-span-2">
              <Champ label="Description">
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full resize-y rounded-[10px] border border-coffee/[.18] bg-white px-3.5 py-3.5 text-sm leading-[1.55] text-coffee"
                />
              </Champ>
            </div>
            <div className="md:col-span-2">
              <Champ label="À qui ça s'adresse">
                <textarea
                  rows={2}
                  value={form.cible}
                  onChange={(e) => setForm({ ...form, cible: e.target.value })}
                  className="w-full resize-y rounded-[10px] border border-coffee/[.18] bg-white px-3.5 py-3.5 text-sm leading-[1.55] text-coffee"
                />
              </Champ>
            </div>
          </div>

          {erreur && (
            <div className="mt-3.5 rounded-[10px] bg-brownred/10 px-3.5 py-2.5 text-[12.5px] text-brownred">
              {erreur}
            </div>
          )}

          <div className="mt-[22px] flex gap-2.5">
            <button
              type="button"
              disabled={envoi}
              onClick={enregistrer}
              className="min-h-[48px] flex-1 rounded-full bg-sunflower text-[10.5px] font-bold tracking-[0.14em] text-coffee uppercase disabled:opacity-60"
            >
              {envoi ? "Enregistrement…" : "Enregistrer"}
            </button>
            <button
              type="button"
              onClick={() => setForm(null)}
              className="min-h-[48px] rounded-full bg-coffee/[0.07] px-5 text-[10.5px] font-bold tracking-[0.14em] text-coffee uppercase"
            >
              Annuler
            </button>
          </div>
        </Modal>
      )}

      {suppression && (
        <Modal onClose={() => setSuppression(null)} maxWidth="420px">
          <div className="font-serif text-2xl">Supprimer « {suppression.nom} » ?</div>
          <p className="mt-2.5 text-[13.5px] leading-[1.6] text-clay">
            La prestation disparaît du site public. Les Réservations déjà prises la conservent.
          </p>
          <div className="mt-[22px] flex gap-2.5">
            <button
              type="button"
              onClick={confirmerSuppression}
              className="min-h-[48px] flex-1 rounded-full bg-brownred text-[10.5px] font-bold tracking-[0.14em] text-ivory uppercase"
            >
              Supprimer
            </button>
            <button
              type="button"
              onClick={() => setSuppression(null)}
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

function Champ({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-sans text-[9.5px] font-bold tracking-[0.2em] text-taupe uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}

function Input({
  value,
  onChange,
  type = "text",
  min,
  step,
}: {
  value: string;
  onChange: (v: string) => void;
  type?: string;
  min?: number;
  step?: number;
}) {
  return (
    <input
      type={type}
      min={min}
      step={step}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-[10px] border border-coffee/[.18] bg-white px-3.5 py-3.5 text-sm text-coffee"
    />
  );
}
