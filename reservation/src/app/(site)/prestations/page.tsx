import Image from "next/image";
import type { Metadata } from "next";
import { getPrestations } from "@/lib/data/prestations";

export const metadata: Metadata = {
  title: "Les soins — Stigey",
  description: "Le détail des prestations Stigey : diagnostic, head spa signature, soin apaisant et soin profond cheveux texturés.",
};

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
        <div className="flex flex-col gap-4 md:gap-6">
          {PRESTATIONS.map((p, i) => {
            const imageFirst = i % 2 === 0;
            return (
              <div
                key={p.id}
                className={`overflow-hidden rounded-[26px] md:rounded-[30px] ${
                  p.badge ? "bg-cottonrose" : "bg-white"
                } md:grid md:grid-cols-[340px_1fr] ${
                  imageFirst ? "" : "md:grid-cols-[1fr_340px]"
                }`}
              >
                <div
                  className={`relative h-[170px] md:h-auto md:min-h-[250px] ${
                    imageFirst ? "md:order-1" : "md:order-2"
                  }`}
                >
                  <Image
                    src={p.image}
                    alt={p.nom}
                    fill
                    sizes="(min-width: 768px) 340px, 100vw"
                    className="object-cover"
                  />
                </div>
                <div
                  className={`p-5 md:p-[34px_40px] ${imageFirst ? "md:order-2" : "md:order-1"}`}
                >
                  {p.badge && (
                    <div className="text-[9px] font-bold tracking-[0.2em] text-brownred uppercase md:text-[9.5px] md:tracking-[0.2em]">
                      {p.badge}
                    </div>
                  )}
                  <div className="mt-2 flex flex-col gap-1.5 md:mt-0 md:flex-row md:items-baseline md:justify-between md:gap-5">
                    <h2 className="font-serif text-[23px] font-medium md:text-[32px]">
                      {p.nom}
                    </h2>
                    <div className="flex items-center gap-2 font-sans text-[11px] font-bold tracking-[0.14em] whitespace-nowrap text-brownred uppercase">
                      <span>{p.duree}</span>
                      <span className="h-[3px] w-[3px] rounded-full bg-sunflower" />
                      <span>{p.prix}</span>
                    </div>
                  </div>
                  <p
                    className={`mt-3 max-w-[620px] text-[13.5px] leading-[1.65] md:hidden ${
                      p.badge ? "text-[#5c1a18]" : "text-clay"
                    }`}
                  >
                    {p.descriptionMobile ?? p.description}
                  </p>
                  <p
                    className={`mt-4 hidden max-w-[620px] text-[14.5px] leading-[1.75] md:block ${
                      p.badge ? "text-[#5c1a18]" : "text-clay"
                    }`}
                  >
                    {p.description}
                  </p>
                  <div
                    className={`mt-3.5 border-t pt-3.5 text-[12.5px] leading-[1.6] md:mt-[22px] md:pt-[18px] md:text-[13.5px] ${
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

        <div className="mt-6 rounded-[26px] bg-coffee p-[22px] text-[#f6e3d6] md:mt-10 md:rounded-[30px] md:p-[44px_48px]">
          <h3 className="font-serif text-[23px] font-normal text-ivory md:text-[34px]">
            Bon à savoir
          </h3>
          <div className="mt-4 flex flex-col gap-3.5 md:mt-7 md:grid md:grid-cols-3 md:gap-[34px]">
            <div>
              <div className="text-[10px] font-bold tracking-[0.16em] text-sunflower uppercase md:tracking-[0.18em]">
                Avant le soin
              </div>
              <p className="mt-1.5 text-[13px] leading-[1.6] text-latte md:hidden">
                Venez avec vos cheveux comme ils sont : pas besoin de les laver.
              </p>
              <p className="mt-2 hidden text-sm leading-[1.7] text-latte md:block">
                Venez avec vos cheveux comme ils sont : pas besoin de les laver avant de venir.
              </p>
            </div>
            <div>
              <div className="text-[10px] font-bold tracking-[0.16em] text-sunflower uppercase md:tracking-[0.18em]">
                Rythme conseillé
              </div>
              <p className="mt-1.5 text-[13px] leading-[1.6] text-latte md:mt-2 md:text-sm md:leading-[1.7]">
                Un soin toutes les 4 à 6 semaines pour installer un vrai changement.
              </p>
            </div>
            <div>
              <div className="text-[10px] font-bold tracking-[0.16em] text-sunflower uppercase md:tracking-[0.18em]">
                Ce que je ne fais pas
              </div>
              <p className="mt-1.5 text-[13px] leading-[1.6] text-latte md:mt-2 md:text-sm md:leading-[1.7]">
                Ni coupe, ni coiffage, ni coloration : uniquement le soin du cuir chevelu et du
                cheveu.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
