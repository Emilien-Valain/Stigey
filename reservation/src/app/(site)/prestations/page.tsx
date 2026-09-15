import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getPrestations } from "@/lib/data/prestations";

export const metadata: Metadata = {
  title: "Les soins — Stigey",
  description: "Le détail des prestations Stigey : diagnostic, head spa signature, soin apaisant et soin profond cheveux texturés.",
};

// Repères courts affichés au-dessus du titre de chaque carte, dans l'ordre du catalogue.
const EYEBROWS = ["Pour commencer", "Le plus demandé", "Tout en douceur", "Le plus long"];

export default async function PrestationsPage() {
  const PRESTATIONS = await getPrestations();
  return (
    <main>
      <section className="bg-coffee px-5 pt-8 pb-8 text-center md:px-12 md:pt-11 md:pb-[60px] md:grid md:grid-cols-2 md:items-end md:gap-[60px] md:text-left">
        <div>
          <div className="text-[9.5px] font-bold tracking-[0.26em] text-cottonrose uppercase md:text-[10px] md:tracking-[0.28em]">
            Les soins
          </div>
          <h1 className="mt-3 font-serif text-[40px] leading-[1.06] font-normal text-ivory md:mt-[18px] md:text-[66px] md:leading-none">
            Chaque cuir chevelu a son <span className="text-cottonrose italic">rituel</span>.
          </h1>
        </div>
        <p className="mt-3.5 text-[14.5px] leading-[1.65] text-sand md:hidden">
          Tous les soins commencent par un temps d&apos;écoute et une observation du cuir
          chevelu. Le protocole s&apos;ajuste ensuite à votre texture.
        </p>
        <p className="hidden text-base leading-[1.75] text-sand md:block">
          Tous les soins commencent par un temps d&apos;écoute et une observation du cuir
          chevelu. Le protocole s&apos;ajuste ensuite à votre texture, à votre sensibilité et
          à vos habitudes.
        </p>
      </section>

      <section className="rounded-t-[44px] bg-ivory px-5 py-[30px] md:rounded-t-[60px] md:px-12 md:py-[60px]">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PRESTATIONS.map((p, i) => {
            const eyebrow = EYEBROWS[i];
            return (
              <div
                key={p.id}
                className={`flex flex-col overflow-hidden rounded-[26px] md:rounded-2xl ${
                  p.badge ? "bg-cottonrose" : "bg-white"
                }`}
              >
                <div className="relative h-[170px] md:h-[132px]">
                  <Image
                    src={p.image}
                    alt={p.nom}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col p-5 md:p-[18px_20px_20px]">
                  {eyebrow && (
                    <div
                      className={`text-[9px] font-bold tracking-[0.2em] uppercase md:text-[8.5px] ${
                        p.badge ? "text-brownred" : "text-taupe"
                      }`}
                    >
                      {eyebrow}
                    </div>
                  )}
                  <h2 className="mt-2 font-serif text-[23px] leading-[1.25] font-medium md:mt-2 md:text-[19px]">
                    {p.nom}
                  </h2>
                  <div className="mt-2 flex items-center gap-2 font-sans text-[11px] font-bold tracking-[0.14em] whitespace-nowrap text-brownred uppercase md:text-[9.5px]">
                    <span>{p.duree}</span>
                    <span className="h-[3px] w-[3px] rounded-full bg-sunflower" />
                    <span>{p.prix}</span>
                  </div>
                  <p
                    className={`mt-3 text-[13.5px] leading-[1.65] md:hidden ${
                      p.badge ? "text-[#5c1a18]" : "text-clay"
                    }`}
                  >
                    {p.descriptionMobile ?? p.description}
                  </p>
                  <p
                    className={`mt-3 hidden text-[12.5px] leading-[1.65] md:block ${
                      p.badge ? "text-[#5c1a18]" : "text-clay"
                    }`}
                  >
                    {p.description}
                  </p>
                  <div
                    className={`mt-3.5 border-t pt-3.5 text-[12.5px] leading-[1.6] md:mt-auto md:pt-3 md:text-[11.5px] md:leading-[1.55] ${
                      p.badge
                        ? "border-brownred/25 text-[#5c1a18]"
                        : "border-coffee/[.12] text-clay"
                    }`}
                  >
                    <b className="text-coffee">Pour qui</b> · {p.cible}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bon à savoir — encart sombre sur mobile */}
        <div className="mt-6 rounded-[26px] bg-coffee p-[22px] text-[#f6e3d6] md:hidden">
          <h3 className="font-serif text-[23px] font-normal text-ivory">Bon à savoir</h3>
          <div className="mt-4 flex flex-col gap-3.5">
            <div>
              <div className="text-[10px] font-bold tracking-[0.16em] text-sunflower uppercase">
                Avant le soin
              </div>
              <p className="mt-1.5 text-[13px] leading-[1.6] text-latte">
                Venez avec vos cheveux comme ils sont : pas besoin de les laver.
              </p>
            </div>
            <div>
              <div className="text-[10px] font-bold tracking-[0.16em] text-sunflower uppercase">
                Rythme conseillé
              </div>
              <p className="mt-1.5 text-[13px] leading-[1.6] text-latte">
                Un soin toutes les 4 à 6 semaines pour installer un vrai changement.
              </p>
            </div>
            <div>
              <div className="text-[10px] font-bold tracking-[0.16em] text-sunflower uppercase">
                Ce que je ne fais pas
              </div>
              <p className="mt-1.5 text-[13px] leading-[1.6] text-latte">
                Ni coupe, ni coiffage, ni coloration : uniquement le soin du cuir chevelu et du
                cheveu.
              </p>
            </div>
          </div>
        </div>

        {/* Bon à savoir — simple filet sur desktop */}
        <div className="mt-7 hidden border-t border-coffee/[.14] pt-[26px] md:grid md:grid-cols-[150px_repeat(3,1fr)] md:gap-8">
          <h3 className="font-serif text-[22px] leading-[1.2] font-normal text-coffee">
            Bon à savoir
          </h3>
          <div>
            <div className="text-[8.5px] font-bold tracking-[0.18em] text-brownred uppercase">
              Avant le soin
            </div>
            <p className="mt-[7px] text-[12.5px] leading-[1.65] text-clay">
              Venez avec vos cheveux comme ils sont : pas besoin de les laver avant de venir.
            </p>
          </div>
          <div>
            <div className="text-[8.5px] font-bold tracking-[0.18em] text-brownred uppercase">
              Rythme conseillé
            </div>
            <p className="mt-[7px] text-[12.5px] leading-[1.65] text-clay">
              Un soin toutes les 4 à 6 semaines pour installer un vrai changement.
            </p>
          </div>
          <div>
            <div className="text-[8.5px] font-bold tracking-[0.18em] text-brownred uppercase">
              Ce que je ne fais pas
            </div>
            <p className="mt-[7px] text-[12.5px] leading-[1.65] text-clay">
              Ni coupe, ni coiffage, ni coloration : uniquement le soin du cuir chevelu et du
              cheveu.
            </p>
          </div>
        </div>

        {/* Barre CTA — desktop uniquement */}
        <div className="mt-[30px] hidden items-center justify-between gap-6 rounded-2xl bg-coffee p-[22px_26px] md:flex">
          <div>
            <div className="font-serif text-[21px] font-normal text-ivory">
              Une question avant de choisir ?
            </div>
            <p className="mt-[5px] text-[12.5px] leading-[1.6] text-latte">
              Le diagnostic est le bon point de départ : il orientera le soin le plus juste pour
              vous.
            </p>
          </div>
          <Link
            href="/reservation"
            className="shrink-0 rounded-full bg-sunflower px-[26px] py-3.5 font-sans text-[10.5px] font-bold tracking-[0.16em] text-coffee uppercase transition-all duration-200 hover:brightness-105 active:scale-[0.97]"
          >
            Réserver mon moment
          </Link>
        </div>
      </section>
    </main>
  );
}
