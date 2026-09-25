"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Categorie, Prestation } from "@/lib/data/prestations";
import { grouperParCategorie } from "@/lib/catalogue";
import { genererJours, jourLabel, toISODate } from "@/lib/calendrier";
import { getCreneauxDisponibles, creerReservation } from "@/lib/actions/reservations-publiques";
import type { Slot } from "@/lib/creneaux";
import { emailValide } from "@/lib/validation";
import { libelleSoin } from "@/lib/format";

const STEP_LABELS = ["Le soin", "Le créneau", "Vos coordonnées", "Confirmé"];

export default function ReservationFlow({
  categories,
  prestations,
  joursOuverts,
}: {
  categories: Categorie[];
  prestations: Prestation[];
  joursOuverts: number[];
}) {
  const [step, setStep] = useState(1);
  const [soinId, setSoinId] = useState<string | null>(null);
  // Choix obligatoire pour une Prestation à variantes (voir CONTEXT.md : Variante).
  const [varianteId, setVarianteId] = useState<string | null>(null);
  const [jourTs, setJourTs] = useState<number | null>(null);
  const [heure, setHeure] = useState<string | null>(null);
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [tel, setTel] = useState("");
  const [rgpd, setRgpd] = useState(false);

  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const soin = soinId ? prestations.find((p) => p.id === soinId) : undefined;
  const variante = soin?.variantes.find((v) => v.id === varianteId);
  // Durée, prix et nom effectivement réservés : ceux de la Variante choisie,
  // sinon ceux de la Prestation simple.
  const soinNom = soin ? libelleSoin(soin.nom, variante?.nom) : "";
  const soinMeta = soin ? `${variante?.duree ?? soin.duree} · ${variante?.prix ?? soin.prix}` : "";
  const choixVarianteEnCours = !!soin && soin.variantes.length > 0 && !variante;
  const groupes = grouperParCategorie(categories, prestations, { masquerVides: true });
  const jours = useMemo(() => genererJours(joursOuverts, 8), [joursOuverts]);
  const jourDate = useMemo(() => (jourTs ? new Date(jourTs) : null), [jourTs]);

  useEffect(() => {
    if (!jourDate || !soinId || choixVarianteEnCours) return;
    let annule = false;
    // Fetch-on-param-change (cf. react.dev/learn/you-might-not-need-an-effect
    // #fetching-data) : le drapeau de chargement est bien synchronisé sur un
    // système externe (la requête réseau), pas dérivé d'un autre état React.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSlotsLoading(true);
    getCreneauxDisponibles(soinId, toISODate(jourDate), varianteId ?? undefined)
      .then((s) => {
        if (!annule) setSlots(s);
      })
      .finally(() => {
        if (!annule) setSlotsLoading(false);
      });
    return () => {
      annule = true;
    };
  }, [jourDate, soinId, varianteId, choixVarianteEnCours]);

  const step2Ok = !!(jourTs && heure);
  const emailTouche = email.trim().length > 0;
  const emailInvalide = emailTouche && !emailValide(email);
  const step3Ok = !!(nom.trim() && email.trim() && emailValide(email) && rgpd);

  function reset() {
    setStep(1);
    setSoinId(null);
    setVarianteId(null);
    setJourTs(null);
    setHeure(null);
    setNom("");
    setEmail("");
    setTel("");
    setRgpd(false);
    setErreur(null);
  }

  async function confirmer() {
    if (!soinId || choixVarianteEnCours || !jourDate || !heure || !emailValide(email)) return;
    setEnvoi(true);
    setErreur(null);
    const resultat = await creerReservation({
      prestationId: soinId,
      varianteId: varianteId ?? undefined,
      jour: toISODate(jourDate),
      heure,
      nom,
      email,
      telephone: tel,
    });
    setEnvoi(false);

    if (resultat.ok) {
      setStep(4);
      return;
    }

    if (resultat.conflit) {
      setErreur("Ce créneau vient d'être réservé. Choisissez-en un autre parmi les créneaux à jour ci-dessous.");
      setHeure(null);
      setStep(2);
      setSlotsLoading(true);
      getCreneauxDisponibles(soinId, toISODate(jourDate), varianteId ?? undefined)
        .then(setSlots)
        .finally(() => setSlotsLoading(false));
    } else {
      setErreur("Votre réservation n'a pas pu être enregistrée. Réessayez dans un instant.");
    }
  }

  return (
    <div className="px-5 py-[30px] md:px-12 md:py-[58px]">
      <div className="mt-6 flex gap-1.5 md:mt-9 md:gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-[3px] flex-1 rounded-full ${i < step ? "bg-brownred" : "bg-coffee/10"}`}
          />
        ))}
      </div>
      <div className="mt-2.5 flex justify-between font-sans text-[8.5px] font-bold tracking-[0.14em] text-taupe uppercase md:mt-3 md:text-[9.5px] md:tracking-[0.18em]">
        {STEP_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div className="mt-6 md:mt-9 md:grid md:grid-cols-[1.35fr_1fr] md:items-start md:gap-11">
        <div>
          {step === 1 && soin && choixVarianteEnCours && (
            <div>
              <button
                type="button"
                onClick={() => setSoinId(null)}
                className="font-sans text-[10.5px] font-bold tracking-[0.14em] text-brownred uppercase transition-colors duration-200 hover:text-coffee md:text-[11px]"
              >
                ← Changer de soin
              </button>
              <h2 className="mt-3.5 font-serif text-[28px] font-normal md:mt-4 md:text-[38px]">
                {soin.nom}
              </h2>
              <p className="mt-2 max-w-[560px] text-[13.5px] leading-[1.6] text-clay md:mt-2.5 md:text-[14.5px] md:leading-[1.7]">
                Choisissez votre option : la durée et le prix en dépendent.
              </p>
              <div className="mt-[22px] grid grid-cols-1 gap-[11px] md:mt-[26px] md:grid-cols-2 md:gap-3.5">
                {soin.variantes.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      setVarianteId(v.id);
                      setHeure(null);
                      setStep(2);
                    }}
                    className="block w-full rounded-[22px] border-2 border-transparent bg-white p-[18px] text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-brownred/25 hover:bg-cottonrose/25 hover:shadow-[0_10px_24px_-14px_rgba(32,10,9,0.35)] md:p-5"
                  >
                    <div className="font-serif text-xl font-medium leading-[1.2] md:text-[22px]">
                      {v.nom}
                    </div>
                    <div className="mt-[7px] flex items-center gap-2 font-sans text-[11px] font-bold tracking-[0.14em] text-brownred uppercase">
                      <span>{v.duree}</span>
                      <span className="h-[3px] w-[3px] rounded-full bg-sunflower" />
                      <span>{v.prix}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && !choixVarianteEnCours && (
            <div>
              <h2 className="font-serif text-[28px] font-normal md:text-[38px]">
                Quel soin souhaitez-vous ?
              </h2>
              <p className="mt-2 max-w-[560px] text-[13.5px] leading-[1.6] text-clay md:mt-2.5 md:text-[14.5px] md:leading-[1.7]">
                Si vous hésitez, commencez par le diagnostic : il est déduit du prix de votre
                premier soin.
              </p>
              {groupes.map(({ categorie, prestations: soins }) => (
                <div key={categorie.id} className="mt-[22px] md:mt-[26px]">
                  {groupes.length > 1 && (
                    <h3 className="mb-3 font-sans text-[10.5px] font-bold tracking-[0.18em] text-brownred uppercase">
                      {categorie.nom}
                    </h3>
                  )}
                  <div className="grid grid-cols-1 gap-[11px] md:grid-cols-2 md:gap-3.5">
                    {soins.map((p) => {
                      const active = soinId === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setSoinId(p.id);
                            setVarianteId(null);
                            setHeure(null);
                            // Une Prestation à variantes reste à l'étape 1 : la
                            // durée dépend de la Variante, donc du calendrier.
                            if (p.variantes.length === 0) setStep(2);
                          }}
                          className={`block w-full rounded-[22px] border-2 p-[18px] text-left transition-all duration-200 md:p-5 ${
                            active
                              ? "border-brownred bg-cottonrose"
                              : "border-transparent bg-white hover:-translate-y-0.5 hover:border-brownred/25 hover:bg-cottonrose/25 hover:shadow-[0_10px_24px_-14px_rgba(32,10,9,0.35)]"
                          }`}
                        >
                          <div className="font-serif text-xl font-medium leading-[1.2] md:text-[22px]">
                            {p.nom}
                          </div>
                          <div className="mt-[7px] flex items-center gap-2 font-sans text-[11px] font-bold tracking-[0.14em] text-brownred uppercase">
                            <span>{p.duree}</span>
                            <span className="h-[3px] w-[3px] rounded-full bg-sunflower" />
                            <span>{p.prix}</span>
                          </div>
                          <div className="mt-2 text-[12.5px] text-clay md:mt-2.5 md:text-[13px]">
                            {p.accroche}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {step === 2 && soin && !choixVarianteEnCours && (
            <div>
              <button
                type="button"
                onClick={() => {
                  // Avec variantes, revenir à l'étape 1 rouvre le choix d'option.
                  setVarianteId(null);
                  setStep(1);
                }}
                className="font-sans text-[10.5px] font-bold tracking-[0.14em] text-brownred uppercase transition-colors duration-200 hover:text-coffee md:text-[11px]"
              >
                ← Changer de soin
              </button>
              <h2 className="mt-3.5 font-serif text-[28px] font-normal md:mt-4 md:text-[38px]">
                Choisissez votre créneau
              </h2>

              {erreur && (
                <div className="mt-4 rounded-2xl border border-brownred/20 bg-cottonrose/30 px-4 py-3 text-[12.5px] leading-[1.6] text-[#5c1a18]">
                  {erreur}
                </div>
              )}

              <div
                data-scroll
                className="mt-5 flex gap-2.5 overflow-x-auto pb-1 md:mt-[26px]"
              >
                {jours.map((j) => {
                  const active = jourTs === j.date.getTime();
                  return (
                    <button
                      key={j.date.getTime()}
                      type="button"
                      onClick={() => {
                        setJourTs(j.date.getTime());
                        setHeure(null);
                        setErreur(null);
                      }}
                      className={`shrink-0 rounded-2xl border-2 px-0 py-3 text-center transition-all duration-200 ${
                        active
                          ? "border-coffee bg-coffee text-ivory"
                          : "border-coffee/10 bg-white hover:-translate-y-0.5 hover:border-coffee/30 hover:shadow-[0_8px_18px_-12px_rgba(32,10,9,0.4)]"
                      }`}
                      style={{ width: 64 }}
                    >
                      <div className="text-[9.5px] font-bold tracking-[0.1em] uppercase opacity-70">
                        {j.dow}
                      </div>
                      <div className="mt-[3px] font-serif text-[21px]">{j.num}</div>
                      <div className="text-[9.5px] tracking-[0.06em] opacity-70">
                        {j.mois}
                      </div>
                    </button>
                  );
                })}
              </div>

              {jourDate && (
                <div>
                  <div className="mt-6 text-[10px] font-bold tracking-[0.16em] text-taupe uppercase md:mt-7 md:tracking-[0.18em]">
                    {jourLabel(jourDate)}
                  </div>
                  {slotsLoading ? (
                    <div className="mt-3 text-[12.5px] text-taupe md:mt-3.5">
                      Chargement des créneaux…
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="mt-3 text-[12.5px] text-taupe md:mt-3.5">
                      Aucun créneau disponible ce jour-là.
                    </div>
                  ) : (
                    <div className="mt-3 grid grid-cols-3 gap-2.5 md:mt-3.5 md:grid-cols-4 md:gap-2.5">
                      {slots.map((s) => {
                        const active = heure === s.heure;
                        return (
                          <button
                            key={s.heure}
                            type="button"
                            disabled={!s.libre}
                            onClick={() => setHeure(s.heure)}
                            className={`rounded-2xl border-2 py-3.5 font-sans text-[13px] font-bold tracking-[0.04em] transition-all duration-200 ${
                              active
                                ? "border-brownred bg-brownred text-ivory"
                                : s.libre
                                  ? "border-coffee/10 bg-white hover:-translate-y-0.5 hover:border-brownred/35 hover:bg-cottonrose/20"
                                  : "cursor-not-allowed border-dashed border-coffee/[.14] text-[#b3a294] line-through"
                            }`}
                          >
                            {s.libre ? s.heure : `${s.heure} — complet`}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <SummaryCard
                soinNom={soinNom}
                soinMeta={soinMeta}
                jourTexte={jourDate ? jourLabel(jourDate) : "Créneau à choisir"}
                heure={heure}
              >
                <button
                  type="button"
                  disabled={!step2Ok}
                  onClick={() => step2Ok && setStep(3)}
                  className={`w-full rounded-full py-4 font-sans text-[13px] font-bold tracking-[0.06em] transition-all duration-200 ${
                    step2Ok
                      ? "bg-coffee text-ivory hover:brightness-110 hover:shadow-[0_10px_24px_-12px_rgba(32,10,9,0.55)] active:scale-[0.98]"
                      : "cursor-not-allowed bg-coffee/10 text-taupe"
                  }`}
                >
                  Continuer
                </button>
              </SummaryCard>
            </div>
          )}

          {step === 3 && soin && (
            <div>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="font-sans text-[10.5px] font-bold tracking-[0.14em] text-brownred uppercase transition-colors duration-200 hover:text-coffee md:text-[11px]"
              >
                ← Changer de créneau
              </button>
              <h2 className="mt-3.5 font-serif text-[28px] font-normal md:mt-4 md:text-[38px]">
                Vos coordonnées
              </h2>

              {erreur && (
                <div className="mt-4 rounded-2xl border border-brownred/20 bg-cottonrose/30 px-4 py-3 text-[12.5px] leading-[1.6] text-[#5c1a18]">
                  {erreur}
                </div>
              )}

              <div className="mt-5 flex flex-col gap-3 md:mt-[26px] md:grid md:grid-cols-2 md:gap-3.5">
                <label className="block">
                  <span className="block font-sans text-[10px] font-bold tracking-[0.16em] text-taupe uppercase">
                    Prénom et nom
                  </span>
                  <input
                    type="text"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    placeholder="Awa Diallo"
                    className="mt-1.5 w-full rounded-2xl border-[1.5px] border-coffee/[.14] bg-white px-3.5 py-3.5 font-sans text-[15px] text-coffee transition-colors duration-200 focus:border-brownred/50 focus:outline-none md:mt-2"
                  />
                </label>
                <label className="block">
                  <span className="block font-sans text-[10px] font-bold tracking-[0.16em] text-taupe uppercase">
                    E-mail
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="awa@exemple.fr"
                    aria-invalid={emailInvalide}
                    className={`mt-1.5 w-full rounded-2xl border-[1.5px] bg-white px-3.5 py-3.5 font-sans text-[15px] text-coffee transition-colors duration-200 focus:outline-none md:mt-2 ${
                      emailInvalide
                        ? "border-brownred/60 focus:border-brownred"
                        : "border-coffee/[.14] focus:border-brownred/50"
                    }`}
                  />
                  {emailInvalide && (
                    <span className="mt-1.5 block text-[11.5px] text-brownred">
                      Cet email ne semble pas valide.
                    </span>
                  )}
                </label>
                <label className="block md:col-span-2">
                  <span className="block font-sans text-[10px] font-bold tracking-[0.16em] text-taupe uppercase">
                    Téléphone{" "}
                    <span className="font-normal tracking-normal normal-case">
                      (facultatif)
                    </span>
                  </span>
                  <input
                    type="tel"
                    value={tel}
                    onChange={(e) => setTel(e.target.value)}
                    placeholder="07 71 14 09 45"
                    className="mt-1.5 w-full rounded-2xl border-[1.5px] border-coffee/[.14] bg-white px-3.5 py-3.5 font-sans text-[15px] text-coffee transition-colors duration-200 focus:border-brownred/50 focus:outline-none md:mt-2"
                  />
                </label>
              </div>

              <div className="mt-[18px] flex items-start gap-2.5 md:mt-[22px] md:max-w-[560px] md:gap-3">
                <button
                  type="button"
                  aria-pressed={rgpd}
                  onClick={() => setRgpd((v) => !v)}
                  className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md border-[1.5px] border-coffee/25 text-[13px] font-black leading-none transition-all duration-150 active:scale-90 ${
                    rgpd ? "bg-brownred text-ivory" : "bg-white hover:border-coffee/45"
                  }`}
                >
                  {rgpd ? "✓" : ""}
                </button>
                <span className="text-xs leading-[1.55] text-clay md:text-[13px] md:leading-[1.6]">
                  J&apos;accepte que ces informations soient utilisées uniquement pour gérer
                  mon rendez-vous.
                </span>
              </div>

              <p className="mt-3.5 text-center text-[11.5px] leading-[1.6] text-taupe md:hidden">
                Annulation libre jusqu&apos;à 24 h avant. Aucune information de santé n&apos;est
                demandée : on en parle de vive voix au début du soin.
              </p>

              <SummaryCard
                soinNom={soinNom}
                soinMeta={soinMeta}
                jourTexte={jourDate ? jourLabel(jourDate) : ""}
                heure={heure}
              >
                <button
                  type="button"
                  disabled={!step3Ok || envoi}
                  onClick={confirmer}
                  className={`w-full rounded-full py-4 font-sans text-sm font-bold tracking-[0.04em] transition-all duration-200 ${
                    step3Ok && !envoi
                      ? "bg-brownred text-ivory hover:brightness-110 hover:shadow-[0_10px_24px_-12px_rgba(153,38,43,0.55)] active:scale-[0.98]"
                      : "cursor-not-allowed bg-coffee/10 text-taupe"
                  }`}
                >
                  {envoi ? "Envoi…" : "Confirmer ma réservation"}
                </button>
                <p className="mt-3.5 hidden text-[12.5px] leading-[1.7] text-taupe md:block">
                  Annulation libre jusqu&apos;à 24 h avant le rendez-vous. Aucune information de
                  santé n&apos;est demandée en ligne : on en parle de vive voix au début du
                  soin.
                </p>
              </SummaryCard>
            </div>
          )}

          {step === 4 && soin && (
            <div className="text-center md:text-left">
              <h2 className="font-serif text-[30px] font-normal md:text-[44px]">
                C&apos;est réservé.
              </h2>
              <p className="mt-2.5 text-sm leading-[1.65] text-clay md:mt-3.5 md:max-w-[520px] md:text-base md:leading-[1.75]">
                {nom.trim() ? `À très vite, ${nom.trim().split(" ")[0]} !` : "À très vite !"}{" "}
                Vous recevrez la confirmation par e-mail dès la mise en service du site, puis
                un rappel la veille du rendez-vous.
              </p>

              <div className="mt-[22px] rounded-3xl bg-white p-[22px] text-left md:mt-[30px] md:rounded-[24px]">
                <div className="font-serif text-xl md:text-[21px]">{soinNom}</div>
                <div className="mt-1.5 font-sans text-[11px] font-bold tracking-[0.14em] text-brownred uppercase">
                  {soinMeta}
                </div>
                <div className="mt-3.5 border-t border-coffee/10 pt-3.5 text-sm">
                  {jourDate ? jourLabel(jourDate) : ""} à {heure}
                </div>
                <div className="mt-1.5 text-[12.5px] leading-[1.6] text-clay">
                  Angers — adresse précise communiquée à la confirmation.
                </div>
              </div>

              <div className="mt-[18px] flex flex-col gap-2.5 md:flex-row">
                <button
                  type="button"
                  disabled
                  title="Disponible dès la mise en service du site"
                  className="cursor-not-allowed rounded-full bg-coffee/40 px-8 py-4 text-center font-sans text-xs font-bold tracking-[0.12em] text-ivory/70 uppercase md:px-8 md:py-4"
                >
                  Ajouter à mon agenda
                </button>
                <Link
                  href="/"
                  className="rounded-full border border-coffee/25 px-7 py-3.5 text-center font-sans text-[11px] font-bold tracking-[0.14em] text-coffee uppercase transition-colors duration-200 hover:border-coffee/50 hover:bg-coffee/5"
                >
                  Retour à l&apos;accueil
                </Link>
              </div>
              <button
                type="button"
                onClick={reset}
                className="mt-3.5 font-sans text-[11.5px] text-taupe underline transition-colors duration-200 hover:text-coffee"
              >
                Réserver un autre soin
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  soinNom,
  soinMeta,
  jourTexte,
  heure,
  children,
}: {
  soinNom: string;
  soinMeta: string;
  jourTexte: string;
  heure: string | null;
  children: React.ReactNode;
}) {
  return (
    <aside className="mt-5 rounded-3xl bg-white p-5 md:mt-0 md:sticky md:top-24 md:rounded-[30px] md:p-[30px]">
      <div className="font-sans text-[10px] font-bold tracking-[0.2em] text-brownred uppercase">
        Votre rendez-vous
      </div>
      <div className="mt-2.5 font-serif text-xl leading-[1.2] md:mt-3.5 md:text-[26px]">
        {soinNom}
      </div>
      <div className="mt-1.5 font-sans text-[11px] font-bold tracking-[0.14em] text-brownred uppercase md:mt-2">
        {soinMeta}
      </div>
      <div className="mt-3.5 border-t border-coffee/10 pt-3.5 md:mt-[18px] md:pt-4">
        <div className="font-sans text-[10px] font-bold tracking-[0.16em] text-taupe uppercase">
          Créneau
        </div>
        <div className="mt-1.5 text-sm leading-[1.5] md:mt-2 md:text-[15px]">
          {jourTexte} {heure ?? ""}
        </div>
      </div>
      <div className="mt-3.5 border-t border-coffee/10 pt-3.5 md:mt-[18px] md:pt-4">
        <div className="font-sans text-[10px] font-bold tracking-[0.16em] text-taupe uppercase">
          Lieu
        </div>
        <div className="mt-1.5 text-[13px] leading-[1.5] text-clay md:mt-2 md:text-sm md:leading-[1.6]">
          Angers
        </div>
      </div>
      <div className="mt-4 md:mt-6">{children}</div>
      <div className="mt-4 text-[11.5px] leading-[1.6] text-taupe md:mt-[22px]">
        Paiement sur place. Annulation libre jusqu&apos;à 24 h avant.
      </div>
    </aside>
  );
}
